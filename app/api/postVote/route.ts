import { NextResponse } from "next/server";
import Prisma from "@/app/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url!);
  const user_id = searchParams.get("user_id");
  const post_id = searchParams.get("post_id");

  if (!user_id || !post_id) {
    return NextResponse.json(
      { error: "Missing user_id or post_id" },
      { status: 400 }
    );
  }

  try {
    const vote = await Prisma.postVote.findUnique({
      where: {
        user_id_post_id: {
          user_id: parseInt(user_id),
          post_id: parseInt(post_id),
        },
      },
    });
    return NextResponse.json({ type: vote?.type ?? null });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Failed to fetch post vote status" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { user_id, post_id, type } = await req.json();
    if (!user_id || !post_id || !type) {
      return NextResponse.json(
        { error: "Missing user_id, post_id, or type" },
        { status: 400 }
      );
    }
    if (type === "REMOVE") {
      await Prisma.postVote.deleteMany({
        where: { user_id, post_id },
      });
      return NextResponse.json({ message: "Vote removed" });
    }
    // UPVOTE or DOWNVOTE
    const existingVote = await Prisma.postVote.findUnique({
      where: { user_id_post_id: { user_id, post_id } },
    });
    if (existingVote) {
      if (existingVote.type === type) {
        return NextResponse.json(
          { message: `Already ${type.toLowerCase()}d` },
          { status: 400 }
        );
      } else {
        await Prisma.postVote.update({
          where: { user_id_post_id: { user_id, post_id } },
          data: { type },
        });
        return NextResponse.json({
          message: `Changed vote to ${type.toLowerCase()}`,
        });
      }
    } else {
      await Prisma.postVote.create({
        data: { user_id, post_id, type },
      });
      return NextResponse.json({
        message: `${type.charAt(0) + type.slice(1).toLowerCase()}d`,
      });
    }
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Vote operation failed" },
      { status: 500 }
    );
  }
}
