import Prisma from "../../lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { user_id, post_id } = await req.json();
    const existingVote = await Prisma.postVote.findUnique({
      where: { user_id_post_id: { user_id, post_id } },
    });
    if (existingVote) {
      if (existingVote.type === "DOWNVOTE") {
        return NextResponse.json(
          { message: "Already downvoted" },
          { status: 400 }
        );
      } else {
        await Prisma.postVote.update({
          where: { user_id_post_id: { user_id, post_id } },
          data: { type: "DOWNVOTE" },
        });
        return NextResponse.json({ message: "Changed upvote to downvote" });
      }
    } else {
      await Prisma.postVote.create({
        data: { user_id, post_id, type: "DOWNVOTE" },
      });
      return NextResponse.json({ message: "Downvoted" });
    }
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: "Downvote failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { post_id } = await req.json();
    const downvoteCount = await Prisma.postVote.count({
      where: { post_id, type: "DOWNVOTE" },
    });
    return NextResponse.json({ downvoteCount });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Failed to get downvote count" },
      { status: 500 }
    );
  }
}
