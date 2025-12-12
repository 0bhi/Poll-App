import { Ratelimit, type Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "./apiResponse";
import { logger } from "./logger";

// Defaults to enabled; set RATE_LIMIT_ENABLED=false for builds/tests or to bypass
const rateLimitEnabled =
  process.env.RATE_LIMIT_ENABLED !== "false" &&
  process.env.NODE_ENV === "production";
const hasRedisConfig =
  Boolean(process.env.UPSTASH_REDIS_REST_URL) &&
  Boolean(process.env.UPSTASH_REDIS_REST_TOKEN);

type RateLimiter = {
  limit: (identifier: string) => Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
  }>;
};

// No-op limiter so callers never juggle nulls during builds/exports
const noopLimiter: RateLimiter = {
  async limit() {
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: Date.now(),
    };
  },
};

const createLimiter = (limit: number, window: Duration): RateLimiter => {
  if (!rateLimitEnabled || !hasRedisConfig) return noopLimiter;

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, window),
    analytics: true,
    prefix: "@upstash/ratelimit",
  });
};

// Centralized config getter
export const getRateLimitConfig = (
  limiter: RateLimiter = defaultRateLimiter
) => {
  const enabled = rateLimitEnabled && hasRedisConfig;
  return { enabled, limiter };
};

// Default rate limiter: 10 requests per 10 seconds
export const defaultRateLimiter = createLimiter(10, "10 s");

// Strict rate limiter for auth endpoints: 5 requests per minute
export const authRateLimiter = createLimiter(5, "1 m");

// Moderate rate limiter for write operations: 20 requests per minute
export const writeRateLimiter = createLimiter(20, "1 m");

// Get client identifier (IP address or user ID)
const getIdentifier = (req: NextRequest, userId?: number): string => {
  if (userId) {
    return `user:${userId}`;
  }
  // Fallback to IP address
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded
    ? forwarded.split(",")[0]
    : req.headers.get("x-real-ip") || "unknown";
  return `ip:${ip}`;
};

// Rate limit middleware
export async function withRateLimit(
  req: NextRequest,
  limiter: RateLimiter = defaultRateLimiter,
  userId?: number
): Promise<NextResponse | null> {
  const { limiter: activeLimiter } = getRateLimitConfig(limiter);

  try {
    const identifier = getIdentifier(req, userId);
    const { success, limit, remaining, reset } = await activeLimiter.limit(
      identifier
    );

    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000);
      const response = errorResponse(
        "Too many requests",
        "RATE_LIMIT_EXCEEDED",
        {
          message: "Rate limit exceeded. Please try again later.",
          retryAfter,
        },
        429
      );
      // Add rate limit headers
      response.headers.set("X-RateLimit-Limit", limit.toString());
      response.headers.set("X-RateLimit-Remaining", remaining.toString());
      response.headers.set("X-RateLimit-Reset", new Date(reset).toISOString());
      response.headers.set("Retry-After", retryAfter.toString());
      return response;
    }

    return null; // No rate limit exceeded, continue
  } catch (error) {
    // If rate limiting fails, log but don't block the request
    logger.error("Rate limiting error", error);
    return null;
  }
}
