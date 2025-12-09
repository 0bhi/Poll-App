import Prisma from "@/app/lib/db";
import { NextResponse, NextRequest } from "next/server";
import { handleError } from "@/app/lib/errorHandler";
import { withRateLimit } from "@/app/lib/rateLimit";
import { successResponse } from "@/app/lib/apiResponse";

export async function GET(req: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await withRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const res = await Prisma.vote.findMany();
    return successResponse(res);
  } catch (error) {
    return handleError(error, req);
  }
}
