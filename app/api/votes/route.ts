import Prisma from "@/app/lib/db";
import { NextResponse, NextRequest } from "next/server";
import { handleError } from "@/app/lib/errorHandler";

export async function GET(req: NextRequest) {
  try {
    const res = await Prisma.vote.findMany();
    return NextResponse.json(res);
  } catch (error) {
    return handleError(error, req);
  }
}
