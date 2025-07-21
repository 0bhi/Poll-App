import prisma from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("user_id");
    if (userId) {
      const notifications = await prisma.notifications.findMany({
        where: {
          user_id: parseInt(userId),
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
      return NextResponse.json({ notifications: notificationsWithActors });
    }
    return NextResponse.json({ message: "userId not found" });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ error: err });
  }
}
