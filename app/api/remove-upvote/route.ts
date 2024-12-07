import { NextRequest, NextResponse } from "next/server";
import Prisma from "../../lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body) {
      return NextResponse.json({ msg: "no body" });
    }
    const res = Prisma.post.update({
      where: {
        id: body.id,
      },
      data: {
        upvote: {
          decrement: 1,
        },
      },
    });
    return NextResponse.json(res);
  } catch (error) {
    console.log(error);
    return NextResponse.json(error);
  }
}
