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
  console.log(body);
  try {
    const res = await Prisma.vote.create({
      data: {
        option_id: parseInt(body.option_id),
        user_id: parseInt(body.user_id),
        post_id: parseInt(body.post_id),
      },
    });
    const NotifRes = await Prisma.notifications.create({
      data: {
        text: `${body.name} voted in your post`,
        user_id: parseInt(body.postAuthorId),
        type: "VOTE",
      },
    });

    console.log(res);
    return NextResponse.json({ res, NotifRes });
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
