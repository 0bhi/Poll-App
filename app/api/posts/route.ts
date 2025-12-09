import Prisma from "../../lib/db";
import { NextResponse, NextRequest } from "next/server";
import { getPostsQuerySchema } from "../../lib/schemas";
import { validateQuery } from "../../lib/validation";
import { handleError } from "../../lib/errorHandler";
import { withRateLimit } from "../../lib/rateLimit";
import { successResponse } from "../../lib/apiResponse";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await withRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const validation = validateQuery(req, getPostsQuerySchema);
    if (!validation.success) {
      return validation.error;
    }

    const { take, cursor } = validation.data;

    const findManyArgs: any = {
      orderBy: { createdAt: "desc" },
      include: {
        options: { include: { votes: true } },
      },
      take,
    };

    if (cursor) {
      findManyArgs.skip = 1;
      findManyArgs.cursor = { id: cursor };
    }

    const posts = await Prisma.post.findMany(findManyArgs);

    const nextCursor =
      posts.length === take ? posts[posts.length - 1].id : null;

    return successResponse(posts, { nextCursor });
  } catch (error) {
    return handleError(error, req);
  }
}
