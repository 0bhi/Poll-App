import { NextRequest } from "next/server";
import Prisma from "../../lib/db";
import { NextResponse } from "next/server";
import { createPostSchema, getPostQuerySchema } from "../../lib/schemas";
import { validateBody, validateQuery } from "../../lib/validation";

export async function POST(req: NextRequest) {
  try {
    const validation = await validateBody(req, createPostSchema);
    if (!validation.success) {
      return validation.error;
    }
    
    const { text, options, user_id } = validation.data;

    const post = await Prisma.post.create({
      data: {
        text,
        options: {
          create: options.map((option: string) => ({ text: option })),
        },
        user_id: typeof user_id === "string" ? parseInt(user_id) : user_id,
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
    const validation = validateQuery(req, getPostQuerySchema);
    if (!validation.success) {
      return validation.error;
    }

    const { postid } = validation.data;
    if (postid) {
      const post = await Prisma.post.findUnique({
        where: {
          id: postid,
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
    return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 });
  }
}
