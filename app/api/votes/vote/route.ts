import { NextResponse, NextRequest } from "next/server";
import Prisma from "@/app/lib/db";
import { getVoteQuerySchema, createVoteSchema, deleteVoteSchema } from "@/app/lib/schemas";
import { validateQuery, validateBody } from "@/app/lib/validation";

export async function GET(req: NextRequest) {
  try {
    const validation = validateQuery(req, getVoteQuerySchema);
    if (!validation.success) {
      return validation.error;
    }

    const { userId, postId } = validation.data;

    const vote = await Prisma.vote.findFirst({
      where: {
        user_id: userId,
        post_id: postId,
      },
    });

    return NextResponse.json({ vote });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: "vote not found" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const validation = await validateBody(req, createVoteSchema);
    if (!validation.success) {
      return validation.error;
    }

    const { user_id, post_id, option_id, postAuthorId, name } = validation.data;
    const userId = typeof user_id === "string" ? parseInt(user_id) : user_id;
    const postId = typeof post_id === "string" ? parseInt(post_id) : post_id;
    const postAuthorIdNum = typeof postAuthorId === "string" ? parseInt(postAuthorId) : postAuthorId;
    const optionIdNum = typeof option_id === "string" ? parseInt(option_id) : option_id;

    const existingVote = await Prisma.vote.findFirst({
      where: {
        user_id: userId,
        post_id: postId,
      },
    });

    if (existingVote) {
      return NextResponse.json({ error: "vote already exists" }, { status: 409 });
    }

    // Grouped notification logic
    // Find existing notification for this post and recipient
    const existingNotif = await Prisma.notifications.findFirst({
      where: {
        user_id: postAuthorIdNum,
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
      notifText = `${name} voted on your post`;
      await Prisma.notifications.create({
        data: {
          text: notifText,
          user_id: postAuthorIdNum,
          type: "VOTE",
          actorIds,
        },
      });
    }

    const res = await Prisma.vote.create({
      data: {
        option_id: optionIdNum,
        user_id: userId,
        post_id: postId,
      },
    });
    return NextResponse.json({ res });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: "vote creation failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const validation = await validateBody(req, deleteVoteSchema);
    if (!validation.success) {
      return validation.error;
    }

    const { id } = validation.data;
    const parsedId = typeof id === "string" ? parseInt(id) : id;

    const res = await Prisma.vote.delete({
      where: {
        id: parsedId,
      },
    });
    console.log(res);
    return NextResponse.json({ res });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: "vote deletion failed" }, { status: 500 });
  }
}
