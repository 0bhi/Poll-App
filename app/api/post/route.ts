import { NextRequest } from "next/server";
import Prisma from "../../lib/db";
import { NextResponse } from "next/server";
import { createPostSchema, getPostQuerySchema } from "../../lib/schemas";
import { validateBody, validateQuery } from "../../lib/validation";
import { handleError } from "../../lib/errorHandler";
import { NotFoundError, ValidationError } from "../../lib/errors";
import { withAuth } from "../../lib/authMiddleware";
import { withRateLimit, writeRateLimiter } from "../../lib/rateLimit";

export async function POST(req: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await withRateLimit(req, writeRateLimiter);
  if (rateLimitResponse) return rateLimitResponse;

  return withAuth(async (req: NextRequest, userId: number) => {
    try {
      const validation = await validateBody(req, createPostSchema);
      if (!validation.success) {
        return validation.error;
      }
      
      const { text, options, user_id } = validation.data;
      
      // Verify the authenticated user matches the user_id in the request
      const parsedUserId = typeof user_id === "string" ? parseInt(user_id) : user_id;
      if (parsedUserId !== userId) {
        return NextResponse.json(
          { error: "Unauthorized: User ID mismatch" },
          { status: 403 }
        );
      }

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
  })(req);
}

export async function GET(req: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await withRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

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
