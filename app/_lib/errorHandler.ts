import { NextRequest, NextResponse } from "next/server";
import { AppError } from "./errors";
import { logger } from "./logger";
import { Prisma } from "@prisma/client";
import { errorResponse } from "./apiResponse";

/**
 * Handles errors and returns appropriate NextResponse
 */
export function handleError(error: unknown, req?: NextRequest): NextResponse {
  // Handle known AppError instances
  if (error instanceof AppError) {
    logger.error(`AppError: ${error.message}`, error, {
      statusCode: error.statusCode,
      code: error.code,
      isOperational: error.isOperational,
      path: req?.nextUrl?.pathname,
      method: req?.method,
    });

    return errorResponse(
      error.message,
      error.code,
      error.details,
      error.statusCode
    );
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(error, req);
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    logger.error("Prisma validation error", error, {
      path: req?.nextUrl?.pathname,
      method: req?.method,
    });
    return errorResponse("Invalid data provided", "VALIDATION_ERROR", undefined, 400);
  }

  // Handle unknown errors
  logger.error("Unhandled error", error, {
    path: req?.nextUrl?.pathname,
    method: req?.method,
  });

  return errorResponse(
    "An unexpected error occurred",
    "INTERNAL_SERVER_ERROR",
    undefined,
    500
  );
}

/**
 * Handles Prisma-specific errors
 */
function handlePrismaError(
  error: Prisma.PrismaClientKnownRequestError,
  req?: NextRequest
): NextResponse {
  logger.error(`Prisma error: ${error.code}`, error, {
    code: error.code,
    meta: error.meta,
    path: req?.nextUrl?.pathname,
    method: req?.method,
  });

  switch (error.code) {
    case "P2002":
      // Unique constraint violation
      return errorResponse(
        "A record with this value already exists",
        "CONFLICT_ERROR",
        error.meta,
        409
      );

    case "P2025":
      // Record not found
      return errorResponse("Record not found", "NOT_FOUND", undefined, 404);

    case "P2003":
      // Foreign key constraint violation
      return errorResponse(
        "Referenced record does not exist",
        "VALIDATION_ERROR",
        undefined,
        400
      );

    default:
      return errorResponse(
        "Database operation failed",
        "DATABASE_ERROR",
        undefined,
        500
      );
  }
}

/**
 * Wrapper for API route handlers to automatically handle errors
 */
export function withErrorHandler<T extends unknown[]>(
  handler: (req: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      return await handler(req, ...args);
    } catch (error) {
      return handleError(error, req);
    }
  };
}
