import { NextRequest } from "next/server";
import Prisma from "../../lib/db";
import { NextResponse } from "next/server";
import { createPostSchema, getPostQuerySchema } from "../../lib/schemas";
import { validateBody, validateQuery } from "../../lib/validation";
import { handleError } from "../../lib/errorHandler";
import { NotFoundError, ValidationError } from "../../lib/errors";

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
  } catch (error) {
    return handleError(error, req);
  }
}

export async function GET(req: NextRequest) {
  try {
    const validation = validateQuery(req, getPostQuerySchema);
    if (!validation.success) {
      return validation.error;
    }

    const { postid } = validation.data;
    if (!postid) {
      throw new ValidationError("Post ID is required");
    }

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

    if (!post) {
      throw new NotFoundError("Post");
    }

    return NextResponse.json(post);
  } catch (error) {
    return handleError(error, req);
  }
}
