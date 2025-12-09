import Prisma from "../../lib/db";
import { NextRequest, NextResponse } from "next/server";
import { createCommentSchema } from "../../lib/schemas";
import { validateBody } from "../../lib/validation";

export async function POST(req: NextRequest) {
  try {
    const validation = await validateBody(req, createCommentSchema);
    if (!validation.success) {
      return validation.error;
    }

    const { comment, postid, userid, parentId } = validation.data;
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
    console.log(error);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}
