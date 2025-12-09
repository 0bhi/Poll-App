import { NextResponse } from "next/server";

/**
 * Standardized API response format
 *
 * Success responses: { data: T, meta?: M }
 * Error responses: { error: string, code?: string, details?: unknown }
 */

/**
 * Creates a standardized success response
 * @param data - The response data
 * @param meta - Optional metadata (e.g., pagination info)
 * @param status - HTTP status code (default: 200)
 */
export function successResponse<T, M = unknown>(
  data: T,
  meta?: M,
  status: number = 200
): NextResponse {
  const response: { data: T; meta?: M } = { data };
  if (meta !== undefined) {
    response.meta = meta;
  }
  return NextResponse.json(response, { status });
}

/**
 * Creates a standardized error response
 * @param error - Error message
 * @param code - Optional error code
 * @param details - Optional error details
 * @param status - HTTP status code (default: 500)
 */
export function errorResponse(
  error: string,
  code?: string,
  details?: unknown,
  status: number = 500
): NextResponse {
  const response: { error: string; code?: string; details?: unknown } = {
    error,
  };
  if (code) {
    response.code = code;
  }
  if (details !== undefined) {
    response.details = details;
  }
  return NextResponse.json(response, { status });
}
