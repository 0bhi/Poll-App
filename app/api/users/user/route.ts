import { NextApiRequest, NextApiResponse } from "next";
import { NextResponse } from "next/server";
import Prisma from "@/app/lib/db";

export async function GET(req: any) {
  const user_id = req.nextUrl.searchParams.get("user_id");
  try {
    const user = await Prisma.user.findUnique({
      where: {
        id: parseInt(user_id),
      },
    });
    return NextResponse.json(user);
  } catch (error) {
    console.log(error);
    return NextResponse.json(error);
  }
}
