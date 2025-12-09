import { NextRequest, NextResponse } from "next/server";
import Prisma from "@/app/lib/db";
import { searchUsersQuerySchema } from "@/app/lib/schemas";
import { validateQuery } from "@/app/lib/validation";

export async function GET(req: NextRequest) {
  try {
    const validation = validateQuery(req, searchUsersQuerySchema);
    if (!validation.success) {
      return validation.error;
    }

    const { q: query, current_user_id } = validation.data;

    const users = await Prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { username: { contains: query, mode: 'insensitive' } },
            ],
          },
          { id: { not: current_user_id } }, // Exclude current user
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
