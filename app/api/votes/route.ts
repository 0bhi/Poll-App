import Prisma from "@/app/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const res = await Prisma.vote.findMany();
  return NextResponse.json(res);
}
