import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { ValidationError } from "./errors";
import { handleError } from "./errorHandler";

/**
 * Validates request body against a Zod schema
 */
export async function validateBody<T>(
  req: NextRequest,
  schema: z.ZodType<T, any, any>
): Promise<
  { success: true; data: T } | { success: false; error: NextResponse }
> {
  try {
    const body = await req.json();
    const validatedData = schema.parse(body);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof ZodError) {
      const validationError = new ValidationError(
        "Validation failed",
        error.errors.map((err) => ({
          path: err.path.join("."),
          message: err.message,
        }))
      );
      return {
        success: false,
        error: handleError(validationError, req),
      };
    }
    const jsonError = new ValidationError("Invalid JSON body");
    return {
      success: false,
      error: handleError(jsonError, req),
    };
  }
}

/**
 * Validates query parameters against a Zod schema
 */
export function validateQuery<T>(
  req: NextRequest,
  schema: z.ZodType<T, any, any>
): { success: true; data: T } | { success: false; error: NextResponse } {
  try {
    const params: Record<string, string | null> = {};
    req.nextUrl.searchParams.forEach((value, key) => {
      params[key] = value === "" ? null : value;
    });
    const validatedData = schema.parse(params);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof ZodError) {
      const validationError = new ValidationError(
        "Validation failed",
        error.errors.map((err) => ({
          path: err.path.join("."),
          message: err.message,
        }))
      );
      return {
        success: false,
        error: handleError(validationError, req),
      };
    }
    const queryError = new ValidationError("Invalid query parameters");
    return {
      success: false,
      error: handleError(queryError, req),
    };
  }
}
