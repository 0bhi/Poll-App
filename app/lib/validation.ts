import { NextRequest, NextResponse } from "next/server";
import { ZodSchema, ZodError } from "zod";

/**
 * Validates request body against a Zod schema
 */
export async function validateBody<T>(
  req: NextRequest,
  schema: ZodSchema<T>
): Promise<
  { success: true; data: T } | { success: false; error: NextResponse }
> {
  try {
    const body = await req.json();
    const validatedData = schema.parse(body);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        error: NextResponse.json(
          {
            error: "Validation failed",
            details: error.errors.map((err) => ({
              path: err.path.join("."),
              message: err.message,
            })),
          },
          { status: 400 }
        ),
      };
    }
    return {
      success: false,
      error: NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }),
    };
  }
}

/**
 * Validates query parameters against a Zod schema
 */
export function validateQuery<T>(
  req: NextRequest,
  schema: ZodSchema<T>
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
      return {
        success: false,
        error: NextResponse.json(
          {
            error: "Validation failed",
            details: error.errors.map((err) => ({
              path: err.path.join("."),
              message: err.message,
            })),
          },
          { status: 400 }
        ),
      };
    }
    return {
      success: false,
      error: NextResponse.json(
        { error: "Invalid query parameters" },
        { status: 400 }
      ),
    };
  }
}
