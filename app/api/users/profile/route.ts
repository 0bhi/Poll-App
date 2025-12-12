import { NextRequest } from "next/server";
import Prisma from "@/app/lib/db";
import { handleError } from "@/app/lib/errorHandler";
import { withRateLimit } from "@/app/lib/rateLimit";
import { successResponse } from "@/app/lib/apiResponse";
import { validateQuery } from "@/app/lib/validation";
import { getUserProfileQuerySchema } from "@/app/lib/schemas";
import { NotFoundError } from "@/app/lib/errors";
import { getAuthUserId } from "@/app/lib/authMiddleware";

export async function GET(req: NextRequest) {
  const rateLimitResponse = await withRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const validation = validateQuery(req, getUserProfileQuerySchema);
    if (!validation.success) {
      return validation.error;
    }

    const { username } = validation.data;
    const authUserId = await getAuthUserId(req);

    const user = await Prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        profilePicture: true,
      },
    });

    if (!user) {
      throw new NotFoundError("User");
    }

    const [followersCount, followingCount, posts, followingRecord] =
      await Promise.all([
        Prisma.follows.count({ where: { followingId: user.id } }),
        Prisma.follows.count({ where: { followerId: user.id } }),
        Prisma.post.findMany({
          where: { user_id: user.id },
          orderBy: { createdAt: "desc" },
          include: {
            options: { include: { votes: true } },
          },
        }),
        authUserId
          ? Prisma.follows.findFirst({
              where: { followerId: authUserId, followingId: user.id },
              select: { id: true },
            })
          : Promise.resolve(null),
      ]);

    const isSelf = authUserId === user.id;

    return successResponse({
      ...user,
      followersCount,
      followingCount,
      isFollowing: Boolean(followingRecord) && !isSelf,
      isSelf,
      posts,
    });
  } catch (error) {
    return handleError(error, req);
  }
}

