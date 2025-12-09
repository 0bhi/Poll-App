import { NextRequest, NextResponse } from "next/server";
import { AppError } from "./errors";
import { logger } from "./logger";
import { Prisma } from "@prisma/client";

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

    const response: { error: string; code?: string; details?: unknown } = {
      error: error.message,
      code: error.code,
    };

    if (error.details !== undefined) {
      response.details = error.details;
    }

    return NextResponse.json(response, { status: error.statusCode });
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
    return NextResponse.json(
      {
        error: "Invalid data provided",
        code: "VALIDATION_ERROR",
      },
      { status: 400 }
    );
  }

  // Handle unknown errors
  logger.error("Unhandled error", error, {
    path: req?.nextUrl?.pathname,
    method: req?.method,
  });

  return NextResponse.json(
    {
      error: "An unexpected error occurred",
      code: "INTERNAL_SERVER_ERROR",
    },
    { status: 500 }
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
      return NextResponse.json(
        {
          error: "A record with this value already exists",
          code: "CONFLICT_ERROR",
          details: error.meta,
        },
        { status: 409 }
      );

    case "P2025":
      // Record not found
      return NextResponse.json(
        {
          error: "Record not found",
          code: "NOT_FOUND",
        },
        { status: 404 }
      );

    case "P2003":
      // Foreign key constraint violation
      return NextResponse.json(
        {
          error: "Referenced record does not exist",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );

    default:
      return NextResponse.json(
        {
          error: "Database operation failed",
          code: "DATABASE_ERROR",
        },
        { status: 500 }
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
