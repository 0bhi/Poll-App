import { PrismaClient } from "@prisma/client";
import { NextResponse, NextRequest } from "next/server";
import Prisma from "../../_lib/db";
import { handleError } from "../../_lib/errorHandler";
import { withRateLimit } from "../../_lib/rateLimit";
import { successResponse } from "../../_lib/apiResponse";

export async function GET(req: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await withRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const users = await Prisma.user.findMany();
    return successResponse(users);
  } catch (error) {
    return handleError(error, req);
  }
}
