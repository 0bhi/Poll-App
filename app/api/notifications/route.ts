import prisma from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("user_id");
    if (userId) {
      const notifications = await prisma.notifications.findMany({
        where: {
          user_id: parseInt(userId),
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      return NextResponse.json({ notifications });
    }
    return NextResponse.json({ message: "userId not found" });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ error: err });
  }
}
