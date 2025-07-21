import Prisma from "../../lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const take = parseInt(searchParams.get("take") || "10");
    const cursor = searchParams.get("cursor");

    const findManyArgs: any = {
      orderBy: { createdAt: "desc" },
      include: {
        options: { include: { votes: true } },
      },
      take,
    };

    if (cursor) {
      findManyArgs.skip = 1;
      findManyArgs.cursor = { id: parseInt(cursor) };
    }

    const posts = await Prisma.post.findMany(findManyArgs);

    const nextCursor =
      posts.length === take ? posts[posts.length - 1].id : null;

    return NextResponse.json({ posts, nextCursor });
  } catch (e) {
    console.log(e);
    return NextResponse.json({ error: "Invalid request" });
  }
}
