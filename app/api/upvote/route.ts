import Prisma from "../../lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { user_id, post_id } = await req.json();

    // Atomic upsert logic
    const existingVote = await Prisma.postVote.findUnique({
      where: { user_id_post_id: { user_id, post_id } },
    });

    if (existingVote) {
      if (existingVote.type === "UPVOTE") {
        return NextResponse.json(
          { message: "Already upvoted" },
          { status: 400 }
        );
      } else {
        // Change downvote to upvote
        await Prisma.postVote.update({
          where: { user_id_post_id: { user_id, post_id } },
          data: { type: "UPVOTE" },
        });
        return NextResponse.json({ message: "Changed downvote to upvote" });
      }
    } else {
      await Prisma.postVote.create({
        data: { user_id, post_id, type: "UPVOTE" },
      });
      return NextResponse.json({ message: "Upvoted" });
    }
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: "Upvote failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body || !body.id) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }
    const res = await Prisma.postVote.count({
      where: {
        post_id: body.post_id,
        type: "UPVOTE",
      },
    });
    return NextResponse.json(res);
  } catch (error) {
    console.log(error);
  }
}
