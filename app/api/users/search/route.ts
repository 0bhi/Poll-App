import { NextRequest, NextResponse } from "next/server";
import Prisma from "@/app/lib/db";

export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.get("q");
    const currentUserId = req.nextUrl.searchParams.get("current_user_id");
    
    if (!query || !currentUserId) {
      return NextResponse.json(
        { error: "Query and current user ID are required" },
        { status: 400 }
      );
    }

    const users = await Prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { username: { contains: query, mode: 'insensitive' } },
            ],
          },
          { id: { not: parseInt(currentUserId) } }, // Exclude current user
        ],
      },
      select: {
        id: true,
        name: true,
        username: true,
        profilePicture: true,
        bio: true,
      },
      take: 10,
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error searching users:", error);
    return NextResponse.json(
      { error: "Failed to search users" },
      { status: 500 }
    );
  }
}
