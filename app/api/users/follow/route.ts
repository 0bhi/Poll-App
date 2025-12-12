import { NextRequest } from "next/server";
import Prisma from "@/app/_lib/db";
import { handleError } from "@/app/_lib/errorHandler";
import { withRateLimit } from "@/app/_lib/rateLimit";
import { withAuth } from "@/app/_lib/authMiddleware";
import { validateBody } from "@/app/_lib/validation";
import { followUserSchema } from "@/app/_lib/schemas";
import { ConflictError, NotFoundError } from "@/app/_lib/errors";
import { successResponse } from "@/app/_lib/apiResponse";

export async function POST(req: NextRequest) {
  const rateLimitResponse = await withRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  return withAuth(async (req: NextRequest, userId: number) => {
    try {
      const validation = await validateBody(req, followUserSchema);
      if (!validation.success) {
        return validation.error;
      }

      const { target_user_id, action } = validation.data;

      if (target_user_id === userId) {
        throw new ConflictError("You cannot follow yourself");
      }

      const targetUser = await Prisma.user.findUnique({
        where: { id: target_user_id },
        select: { id: true, name: true },
      });

      if (!targetUser) {
        throw new NotFoundError("User");
      }

      const existingFollow = await Prisma.follows.findUnique({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId: target_user_id,
          },
        },
      });

      const shouldFollow = action === "FOLLOW";

      const { followersCount, userFollowingCount } = await Prisma.$transaction(
        async (tx) => {
          if (shouldFollow && !existingFollow) {
            await tx.follows.create({
              data: {
                followerId: userId,
                followingId: target_user_id,
              },
            });
            const followerUser = await tx.user.findUnique({
              where: { id: userId },
              select: { name: true },
            });
            if (followerUser) {
              await tx.notifications.create({
                data: {
                  user_id: target_user_id,
                  text: `${followerUser.name} started following you`,
                  type: "FOLLOW",
                  actorIds: [userId],
                },
              });
            }
          } else if (!shouldFollow && existingFollow) {
            await tx.follows.delete({
              where: { id: existingFollow.id },
            });
          }

          const [followersCount, userFollowingCount] = await Promise.all([
            tx.follows.count({ where: { followingId: target_user_id } }),
            tx.follows.count({ where: { followerId: userId } }),
          ]);

          await Promise.all([
            tx.user.update({
              where: { id: target_user_id },
              data: { followersCount },
            }),
            tx.user.update({
              where: { id: userId },
              data: { followingCount: userFollowingCount },
            }),
          ]);

          return { followersCount, userFollowingCount };
        }
      );

      return successResponse({
        isFollowing: shouldFollow,
        followersCount,
        userFollowingCount,
      });
    } catch (error) {
      return handleError(error, req);
    }
  })(req);
}

