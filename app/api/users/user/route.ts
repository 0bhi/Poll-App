import { NextRequest, NextResponse } from "next/server";
import Prisma from "@/app/_lib/db";
import { getUserQuerySchema, updateUserSchema } from "@/app/_lib/schemas";
import { validateBody, validateQuery } from "@/app/_lib/validation";
import { handleError } from "@/app/_lib/errorHandler";
import { NotFoundError } from "@/app/_lib/errors";
import { withRateLimit } from "@/app/_lib/rateLimit";
import { successResponse } from "@/app/_lib/apiResponse";
import { withAuth } from "@/app/_lib/authMiddleware";

export async function GET(req: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await withRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const validation = validateQuery(req, getUserQuerySchema);
    if (!validation.success) {
      return validation.error;
    }

    const { user_id } = validation.data;

    const user = await Prisma.user.findUnique({
      where: {
        id: user_id,
      },
    });

    if (!user) {
      throw new NotFoundError("User");
    }

    return successResponse(user);
  } catch (error) {
    return handleError(error, req);
  }
}

export async function PUT(req: NextRequest) {
  const rateLimitResponse = await withRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  return withAuth(async (req: NextRequest, userId: number) => {
    try {
      const validation = await validateBody(req, updateUserSchema);
      if (!validation.success) {
        return validation.error;
      }

      const data = validation.data;
      if (!Object.keys(data).length) {
        return successResponse(await Prisma.user.findUnique({ where: { id: userId } }));
      }

      const updated = await Prisma.user.update({
        where: { id: userId },
        data,
        select: {
          id: true,
          name: true,
          username: true,
          bio: true,
          profilePicture: true,
          followersCount: true,
          followingCount: true,
        },
      });

      return successResponse(updated);
    } catch (error) {
      return handleError(error, req);
    }
  })(req);
}
