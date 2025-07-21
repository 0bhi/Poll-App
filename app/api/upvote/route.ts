import Prisma from "../../lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { user_id, post_id } = await req.json();
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
    const { post_id } = await req.json();
    const upvoteCount = await Prisma.postVote.count({
      where: { post_id, type: "UPVOTE" },
    });
    return NextResponse.json({ upvoteCount });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Failed to get upvote count" },
      { status: 500 }
    );
  }
}
