import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

// Create rate limiters with different limits for different endpoints
export const createRateLimiter = (limit: number, window: string) => {
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, window),
    analytics: true,
    prefix: "@upstash/ratelimit",
  });
};

// Default rate limiter: 10 requests per 10 seconds
export const defaultRateLimiter = createRateLimiter(10, "10 s");

// Strict rate limiter for auth endpoints: 5 requests per minute
export const authRateLimiter = createRateLimiter(5, "1 m");

// Moderate rate limiter for write operations: 20 requests per minute
export const writeRateLimiter = createRateLimiter(20, "1 m");

// Get client identifier (IP address or user ID)
const getIdentifier = (req: NextRequest, userId?: number): string => {
  if (userId) {
    return `user:${userId}`;
  }
  // Fallback to IP address
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0] : req.headers.get("x-real-ip") || "unknown";
  return `ip:${ip}`;
};

// Rate limit middleware
export async function withRateLimit(
  req: NextRequest,
  limiter: Ratelimit = defaultRateLimiter,
  userId?: number
): Promise<NextResponse | null> {
  // Skip rate limiting in development if Redis is not configured
  if (process.env.NODE_ENV === "development" && !process.env.UPSTASH_REDIS_REST_URL) {
    return null;
  }

  try {
    const identifier = getIdentifier(req, userId);
    const { success, limit, remaining, reset } = await limiter.limit(identifier);

    if (!success) {
      return NextResponse.json(
        {
          error: "Too many requests",
          message: "Rate limit exceeded. Please try again later.",
          retryAfter: Math.ceil((reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": new Date(reset).toISOString(),
            "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    return null; // No rate limit exceeded, continue
  } catch (error) {
    // If rate limiting fails, log but don't block the request
    console.error("Rate limiting error:", error);
    return null;
  }
}

