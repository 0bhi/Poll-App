import { NextRequest } from "next/server";
import Prisma from "../../lib/db";
import { NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate required fields
    if (!body.text || !body.options || !body.user_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Filter out empty options and create the options array
    const validOptions = body.options.filter((option: string) => option && option.trim());
    
    if (validOptions.length < 2) {
      return NextResponse.json({ error: "At least 2 options are required" }, { status: 400 });
    }

    const post = await Prisma.post.create({
      data: {
        text: body.text,
        options: {
          create: validOptions.map((option: string) => ({ text: option })),
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
    return NextResponse.json({ error: "Invalid request" }, { status: 500 });
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
