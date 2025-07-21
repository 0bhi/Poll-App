import { NextRequest, NextResponse } from "next/server";
import Prisma from "../../lib/db";

export async function POST(req: NextRequest) {
  try {
    const { user_id, post_id } = await req.json();
    await Prisma.postVote.deleteMany({
      where: { user_id, post_id, type: "DOWNVOTE" },
    });
    return NextResponse.json({ message: "Downvote removed" });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Failed to remove downvote" },
      { status: 500 }
    );
  }
}
