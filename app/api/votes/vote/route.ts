import { NextResponse } from "next/server";
import Prisma from "@/app/lib/db";

export async function GET(req: any) {
  const userId = req.nextUrl.searchParams.get("userId");
  const postId = req.nextUrl.searchParams.get("postId");

  try {
    const vote = await Prisma.vote.findFirst({
      where: {
        user_id: parseInt(userId),
        post_id: parseInt(postId),
      },
    });

    return NextResponse.json({ vote });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: "vote not found" });
  }
}

export async function POST(req: any) {
  const body = await req.json();
  try {
    const userId = parseInt(body.user_id);
    const postId = parseInt(body.post_id);
    const postAuthorId = parseInt(body.postAuthorId);
    const userName = body.name;

    const existingVote = await Prisma.vote.findFirst({
      where: {
        user_id: userId,
        post_id: postId,
      },
    });

    if (existingVote) {
      return NextResponse.json({ error: "vote already exists" });
    }

    // Grouped notification logic
    // Find existing notification for this post and recipient
    const existingNotif = await Prisma.notifications.findFirst({
      where: {
        user_id: postAuthorId,
        type: "VOTE",
        // Optionally, you can add a post_id field to notifications for more precise grouping
        // post_id: postId,
      },
      orderBy: { createdAt: "desc" },
    });

    let notifText = "";
    let actorIds: number[] = [];
    if (existingNotif) {
      // Update actorIds array
      actorIds = existingNotif.actorIds || [];
      if (!actorIds.includes(userId)) {
        actorIds.push(userId);
      }
      // Fetch up to 2 latest actor names for display
      const latestActors = await Prisma.user.findMany({
        where: { id: { in: actorIds.slice(-2) } },
        select: { name: true },
      });
      const names = latestActors.map((u) => u.name);
      const othersCount = actorIds.length - names.length;
      if (actorIds.length === 1) {
        notifText = `${names[0]} voted on your post`;
      } else if (actorIds.length === 2) {
        notifText = `${names[0]} and ${names[1]} voted on your post`;
      } else {
        notifText = `${names.join(
          ", "
        )} and ${othersCount} others voted on your post`;
      }
      await Prisma.notifications.update({
        where: { id: existingNotif.id },
        data: {
          actorIds,
          text: notifText,
          createdAt: new Date(), // bump to top
        },
      });
    } else {
      // New notification
      actorIds = [userId];
      notifText = `${userName} voted on your post`;
      await Prisma.notifications.create({
        data: {
          text: notifText,
          user_id: postAuthorId,
          type: "VOTE",
          actorIds,
        },
      });
    }

    const res = await Prisma.vote.create({
      data: {
        option_id: parseInt(body.option_id),
        user_id: userId,
        post_id: postId,
      },
    });
    return NextResponse.json({ res });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: "vote creation failed" });
  }
}

export async function DELETE(req: any) {
  const body = await req.json();
  try {
    const res = await Prisma.vote.delete({
      where: {
        id: parseInt(body.id),
      },
    });
    console.log(res);
    return NextResponse.json({ res });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: "vote deletion failed" });
  }
}
