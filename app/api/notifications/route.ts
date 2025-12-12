import prisma from "@/app/_lib/db";
import { NextRequest } from "next/server";
import { handleError } from "@/app/_lib/errorHandler";
import { withAuth } from "@/app/_lib/authMiddleware";
import { withRateLimit } from "@/app/_lib/rateLimit";
import { successResponse } from "@/app/_lib/apiResponse";

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
    interface NotificationWithActorIds {
      id: number;
      text: string;
      user_id: number;
      type: string;
      createdAt: Date;
      actorIds?: number[];
    }
    
    interface Actor {
      id: number;
      name: string;
      username: string;
      profilePicture: string | null;
    }
    
    // Collect all unique actor IDs from all notifications
    const allActorIds = new Set<number>();
    notifications.forEach((notif) => {
      const n = notif as NotificationWithActorIds;
      if (n.actorIds && n.actorIds.length > 0) {
        n.actorIds.forEach((id) => allActorIds.add(id));
      }
    });

    // Fetch all actors in a single query
    const actorsMap = new Map<number, Actor>();
    if (allActorIds.size > 0) {
      const actors = await prisma.user.findMany({
        where: { id: { in: Array.from(allActorIds) } },
        select: {
          id: true,
          name: true,
          username: true,
          profilePicture: true,
        },
      });
      actors.forEach((actor) => actorsMap.set(actor.id, actor));
    }

    // Map actors to each notification
    const notificationsWithActors = notifications.map((notif) => {
      const n = notif as NotificationWithActorIds;
      const actors: Actor[] = [];
      if (n.actorIds && n.actorIds.length > 0) {
        n.actorIds.forEach((id) => {
          const actor = actorsMap.get(id);
          if (actor) actors.push(actor);
        });
      }
      return {
        ...notif,
        actors,
      };
    });
      return successResponse(notificationsWithActors);
    } catch (error) {
      return handleError(error, req);
    }
  })(req);
}
