import Prisma from "../../lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const posts = await Prisma.post.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        options: {
          include: {
            votes: true,
          },
        },
      },
    });

    return NextResponse.json(posts);
  } catch (e) {
    console.log(e);
    return NextResponse.json({ error: "Invalid request" });
  }
}
