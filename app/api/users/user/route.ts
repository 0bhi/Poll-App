import { NextRequest, NextResponse } from "next/server";
import Prisma from "@/app/lib/db";
import { getUserQuerySchema } from "@/app/lib/schemas";
import { validateQuery } from "@/app/lib/validation";

export async function GET(req: NextRequest) {
  try {
    const validation = validateQuery(req, getUserQuerySchema);
    if (!validation.success) {
      return validation.error;
    }

    const { user_id } = validation.data;

    const user = await Prisma.user.findUnique({
      where: {
        id: user_id,
      },
    });
    return NextResponse.json(user);
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}
