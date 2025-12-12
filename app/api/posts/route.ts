import Prisma from "../../_lib/db";
import { NextResponse, NextRequest } from "next/server";
import { getPostsQuerySchema } from "../../_lib/schemas";
import { validateQuery } from "../../_lib/validation";
import { handleError } from "../../_lib/errorHandler";
import { withRateLimit } from "../../_lib/rateLimit";
import { successResponse } from "../../_lib/apiResponse";

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

    interface FindManyArgs {
      orderBy: { createdAt: "desc" };
      include: {
        options: { include: { votes: true } };
      };
      take: number;
      skip?: number;
      cursor?: { id: number };
    }
    
    const findManyArgs: FindManyArgs = {
      orderBy: { createdAt: "desc" },
      include: {
        options: { include: { votes: true } },
      },
      take,
    };

    if (cursor) {
      findManyArgs.skip = 1;
      findManyArgs.cursor = { id: typeof cursor === 'string' ? parseInt(cursor, 10) : cursor };
    }

    const posts = await Prisma.post.findMany(findManyArgs);

    const nextCursor =
      posts.length === take ? String(posts[posts.length - 1].id) : null;

    return successResponse(posts, { nextCursor });
  } catch (error) {
    return handleError(error, req);
  }
}
