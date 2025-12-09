import Prisma from "../../lib/db";
import { NextRequest, NextResponse } from "next/server";
import { createCommentSchema } from "../../lib/schemas";
import { validateBody } from "../../lib/validation";
import { handleError } from "../../lib/errorHandler";
import { NotFoundError } from "../../lib/errors";

export async function POST(req: NextRequest) {
  try {
    const validation = await validateBody(req, createCommentSchema);
    if (!validation.success) {
      return validation.error;
    }

    const { comment, postid, userid, parentId } = validation.data;
    
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
    return NextResponse.json(res);
  } catch (error) {
    return handleError(error, req);
  }
}
