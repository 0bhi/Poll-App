import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { AuthenticationError } from "./errors";
import { errorResponse } from "./apiResponse";

/**
 * Authentication middleware to verify user sessions
 * Returns the authenticated user ID or throws an error
 */
export async function requireAuth(req: NextRequest): Promise<number> {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token || !token.id) {
    throw new AuthenticationError("Authentication required");
  }

  const userId =
    typeof token.id === "string" ? parseInt(token.id, 10) : token.id;
  if (isNaN(userId)) {
    throw new AuthenticationError("Invalid user session");
  }

  return userId;
}

/**
 * Optional authentication - returns user ID if authenticated, null otherwise
 */
export async function getAuthUserId(req: NextRequest): Promise<number | null> {
  try {
    return await requireAuth(req);
  } catch {
    return null;
  }
}

/**
 * Higher-order function to wrap API route handlers with authentication
 */
export function withAuth<T extends unknown[]>(
  handler: (
    req: NextRequest,
    userId: number,
    ...args: T
  ) => Promise<NextResponse>
) {
  return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const userId = await requireAuth(req);
      return await handler(req, userId, ...args);
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return errorResponse(
          error.message,
          error.code,
          error.details,
          error.statusCode
        );
      }
      throw error;
    }
  };
}
