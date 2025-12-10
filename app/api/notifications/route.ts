import prisma from "@/app/lib/db";
import { NextRequest } from "next/server";
import { handleError } from "@/app/lib/errorHandler";
import { withAuth } from "@/app/lib/authMiddleware";
import { withRateLimit } from "@/app/lib/rateLimit";
import { successResponse } from "@/app/lib/apiResponse";

export async function GET(req: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await withRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  return withAuth(async (req: NextRequest, userId: number) => {
    try {
      // Use authenticated user ID directly - no need for query parameter
      // This is more secure and avoids validation errors when session is loading
      const notifications = await prisma.notifications.findMany({
      where: {
        user_id: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    // Fetch actor details for each notification
    const notificationsWithActors = await Promise.all(
      notifications.map(async (notif) => {
        let actors: any[] = [];
        const n = notif as any; // cast to any to access actorIds
        if (n.actorIds && n.actorIds.length > 0) {
          actors = await prisma.user.findMany({
            where: { id: { in: n.actorIds } },
            select: {
              id: true,
              name: true,
              username: true,
              profilePicture: true,
            },
          });
        }
        return {
          ...notif,
          actors,
        };
      })
    );
      return successResponse(notificationsWithActors);
    } catch (error) {
      return handleError(error, req);
    }
  })(req);
}
