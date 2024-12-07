import Prisma from "../../lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const res = await Prisma.post.update({
    where: {
      id: parseInt(body.id),
    },
    data: {
      downvote: {
        increment: 1,
      },
    },
  });
  return NextResponse.json(res);
}

export async function GET(req: NextRequest) {
  const body = await req.json();
  const res = await Prisma.post.findUnique({
    where: {
      id: parseInt(body.id),
    },
    select: {
      downvote: true,
    },
  });
  return NextResponse.json(res);
}
