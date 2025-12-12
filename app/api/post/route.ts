import { NextRequest } from "next/server";
import Prisma from "../../_lib/db";
import { NextResponse } from "next/server";
import { createPostSchema, getPostQuerySchema } from "../../_lib/schemas";
import { validateBody, validateQuery } from "../../_lib/validation";
import { handleError } from "../../_lib/errorHandler";
import { NotFoundError, ValidationError } from "../../_lib/errors";
import { withAuth } from "../../_lib/authMiddleware";
import { withRateLimit, writeRateLimiter } from "../../_lib/rateLimit";
import { successResponse, errorResponse } from "../../_lib/apiResponse";

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
      const parsedUserId =
        typeof user_id === "string" ? parseInt(user_id) : user_id;
      if (parsedUserId !== userId) {
        return errorResponse(
          "Unauthorized: User ID mismatch",
          "UNAUTHORIZED",
          undefined,
          403
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
      return successResponse(post);
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
        comments: true, // Fetch all comments for this post
      },
    });

    if (!post) {
      throw new NotFoundError("Post");
    }

    // Build comment tree: separate top-level comments from replies
    interface CommentNode {
      id: number;
      text: string;
      user_id: number;
      createdAt: string;
      parentId: number | null;
      replies: CommentNode[];
    }
    
    // Helper function to recursively build nested replies
    const buildCommentTree = (comments: CommentNode[]): CommentNode[] => {
      const commentMap = new Map<number, CommentNode>();
      const rootComments: CommentNode[] = [];

      // First pass: create a map of all comments with empty replies array
      comments.forEach((comment) => {
        commentMap.set(comment.id, {
          ...comment,
          replies: [],
        });
      });

      // Second pass: build the tree structure
      comments.forEach((comment) => {
        const commentNode = commentMap.get(comment.id)!;
        if (comment.parentId === null || comment.parentId === undefined) {
          // This is a top-level comment
          rootComments.push(commentNode);
        } else {
          // This is a reply, add it to its parent's replies
          const parent = commentMap.get(comment.parentId);
          if (parent) {
            parent.replies.push(commentNode);
          } else {
            // Parent not found, treat as root comment (shouldn't happen, but safety check)
            rootComments.push(commentNode);
          }
        }
      });

      // Recursively sort replies for each comment
      const sortReplies = (comment: CommentNode) => {
        if (comment.replies && comment.replies.length > 0) {
          comment.replies.sort(
            (a: CommentNode, b: CommentNode) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          comment.replies.forEach(sortReplies);
        }
      };

      rootComments.forEach(sortReplies);
      rootComments.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      return rootComments;
    };

    // Build the comment tree
    const structuredComments = buildCommentTree(post.comments);

    // Return post with structured comments
    const postWithStructuredComments = {
      ...post,
      comments: structuredComments,
    };

    return successResponse(postWithStructuredComments);
  } catch (error) {
    return handleError(error, req);
  }
}
