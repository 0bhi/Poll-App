import Prisma from "../../lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body || !body.id) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }
    const res = await Prisma.post.update({
      where: {
        id: parseInt(body.id),
      },
      data: {
        upvote: {
          increment: 1,
        },
      },
    });
    return NextResponse.json(res);
  } catch (error) {
    console.log(error);
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
    const res = await Prisma.post.findUnique({
      where: {
        id: parseInt(body.id),
      },
      select: {
        upvote: true,
      },
    });
    return NextResponse.json(res);
  } catch (error) {
    console.log(error);
  }
}
