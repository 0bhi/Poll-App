import { NextRequest, NextResponse } from "next/server";
import Prisma from "@/app/lib/db";
import { searchUsersQuerySchema } from "@/app/lib/schemas";
import { validateQuery } from "@/app/lib/validation";
import { handleError } from "@/app/lib/errorHandler";
import { withAuth } from "@/app/lib/authMiddleware";
import { withRateLimit } from "@/app/lib/rateLimit";

export async function GET(req: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await withRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  return withAuth(async (req: NextRequest, userId: number) => {
    try {
    const validation = validateQuery(req, searchUsersQuerySchema);
    if (!validation.success) {
      return validation.error;
    }

      const { q: query, current_user_id } = validation.data;
      
      // Verify the authenticated user matches the current_user_id
      if (current_user_id !== userId) {
        return NextResponse.json(
          { error: "Unauthorized: User ID mismatch" },
          { status: 403 }
        );
      }

    const users = await Prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { username: { contains: query, mode: 'insensitive' } },
            ],
          },
          { id: { not: current_user_id } }, // Exclude current user
        ],
      },
      select: {
        id: true,
        name: true,
        username: true,
        profilePicture: true,
        bio: true,
      },
      take: 10,
    });

      return NextResponse.json({ users });
    } catch (error) {
      return handleError(error, req);
    }
  })(req);
}
