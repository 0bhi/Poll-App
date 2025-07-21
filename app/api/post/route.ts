import { NextRequest } from "next/server";
import Prisma from "../../lib/db";
import { NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const post = await Prisma.post.create({
      data: {
        text: body.text,
        options: {
          create: [
            { text: body.options[0] },
            { text: body.options[1] },
            { text: body.options[2] },
            { text: body.options[3] },
          ],
        },
        user_id: parseInt(body.user_id),
      },
      include: {
        options: {
          include: {
            votes: true,
          },
        },
      },
    });
    return NextResponse.json(post);
  } catch (e) {
    console.log(e);
    return NextResponse.json({ error: "Invalid request" });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user_id = req.nextUrl.searchParams.get("postid");
    if (user_id) {
      const post = await Prisma.post.findUnique({
        where: {
          id: parseInt(user_id),
        },
        include: {
          options: {
            include: {
              votes: true,
            },
          },
          comments: {
            include: {
              replies: true,
            },
          },
        },
      });
      return NextResponse.json(post);
    }
  } catch (error) {
    console.log(error);
    return NextResponse.json(error);
  }
}
