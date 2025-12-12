import Prisma from "../../_lib/db";
import { NextRequest, NextResponse } from "next/server";
import { createCommentSchema } from "../../_lib/schemas";
import { validateBody } from "../../_lib/validation";
import { handleError } from "../../_lib/errorHandler";
import { NotFoundError } from "../../_lib/errors";
import { withAuth } from "../../_lib/authMiddleware";
import { withRateLimit, writeRateLimiter } from "../../_lib/rateLimit";
import { successResponse, errorResponse } from "../../_lib/apiResponse";

export async function POST(req: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await withRateLimit(req, writeRateLimiter);
  if (rateLimitResponse) return rateLimitResponse;

  return withAuth(async (req: NextRequest, userId: number) => {
    try {
      const validation = await validateBody(req, createCommentSchema);
      if (!validation.success) {
        return validation.error;
      }

      const { comment, postid, userid, parentId } = validation.data;
      
      // Verify the authenticated user matches the userid in the request
      const parsedUserId = typeof userid === "string" ? parseInt(userid) : userid;
      if (parsedUserId !== userId) {
        return errorResponse("Unauthorized: User ID mismatch", "UNAUTHORIZED", undefined, 403);
      }
    
    // Verify post exists
    const post = await Prisma.post.findUnique({
      where: { id: typeof postid === "string" ? parseInt(postid) : postid },
    });
    if (!post) {
      throw new NotFoundError("Post");
    }

    // Verify parent comment exists if provided
    if (parentId) {
      const parentComment = await Prisma.comment.findUnique({
        where: { id: typeof parentId === "string" ? parseInt(parentId) : parentId },
      });
      if (!parentComment) {
        throw new NotFoundError("Parent comment");
      }
    }

    const res = await Prisma.comment.create({
      data: {
        text: comment,
        postId: typeof postid === "string" ? parseInt(postid) : postid,
        user_id: typeof userid === "string" ? parseInt(userid) : userid,
        parentId: parentId ? (typeof parentId === "string" ? parseInt(parentId) : parentId) : undefined,
      },
    });
      return successResponse(res);
    } catch (error) {
      return handleError(error, req);
    }
  })(req);
}
