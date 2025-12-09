import { NextResponse, NextRequest } from "next/server";
import Prisma from "@/app/lib/db";
import { getPostVoteQuerySchema, createPostVoteSchema } from "@/app/lib/schemas";
import { validateQuery, validateBody } from "@/app/lib/validation";
import { handleError } from "@/app/lib/errorHandler";
import { ValidationError } from "@/app/lib/errors";
import { withAuth } from "@/app/lib/authMiddleware";
import { withRateLimit, writeRateLimiter } from "@/app/lib/rateLimit";
import { successResponse, errorResponse } from "@/app/lib/apiResponse";

export async function GET(req: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await withRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  return withAuth(async (req: NextRequest, userId: number) => {
    try {
    const validation = validateQuery(req, getPostVoteQuerySchema);
    if (!validation.success) {
      return validation.error;
    }

      const { user_id, post_id } = validation.data;
      
      // Verify the authenticated user matches the user_id in the request
      const parsedUserId = typeof user_id === "string" ? parseInt(user_id) : user_id;
      if (parsedUserId !== userId) {
        return errorResponse("Unauthorized: User ID mismatch", "UNAUTHORIZED", undefined, 403);
      }

      const vote = await Prisma.postVote.findUnique({
        where: {
          user_id_post_id: {
            user_id: parsedUserId,
            post_id,
          },
        },
      });

      return successResponse({ type: vote?.type ?? null });
    } catch (error) {
      return handleError(error, req);
    }
  })(req);
}

export async function POST(req: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await withRateLimit(req, writeRateLimiter);
  if (rateLimitResponse) return rateLimitResponse;

  return withAuth(async (req: NextRequest, userId: number) => {
    try {
      const validation = await validateBody(req, createPostVoteSchema);
      if (!validation.success) {
        return validation.error;
      }

      const { user_id, post_id, type } = validation.data;
      const parsedUserId = typeof user_id === "string" ? parseInt(user_id) : user_id;
      const parsedPostId = typeof post_id === "string" ? parseInt(post_id) : post_id;
      
      // Verify the authenticated user matches the user_id in the request
      if (parsedUserId !== userId) {
        return errorResponse("Unauthorized: User ID mismatch", "UNAUTHORIZED", undefined, 403);
      }

    if (type === "REMOVE") {
      await Prisma.postVote.deleteMany({
        where: { user_id: parsedUserId, post_id: parsedPostId },
      });
      return successResponse({ message: "Vote removed" });
    }
    // UPVOTE or DOWNVOTE
    const existingVote = await Prisma.postVote.findUnique({
      where: { user_id_post_id: { user_id: parsedUserId, post_id: parsedPostId } },
    });
    if (existingVote) {
      if (existingVote.type === type) {
        throw new ValidationError(`Already ${type.toLowerCase()}d`);
      } else {
        await Prisma.postVote.update({
          where: { user_id_post_id: { user_id: parsedUserId, post_id: parsedPostId } },
          data: { type },
        });
        return successResponse({
          message: `Changed vote to ${type.toLowerCase()}`,
        });
      }
    } else {
      await Prisma.postVote.create({
        data: { user_id: parsedUserId, post_id: parsedPostId, type },
      });
      return successResponse({
        message: `${type.charAt(0) + type.slice(1).toLowerCase()}d`,
      });
    }
    } catch (error) {
      return handleError(error, req);
    }
  })(req);
}
