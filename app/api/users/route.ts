import { PrismaClient } from "@prisma/client";
import { NextResponse, NextRequest } from "next/server";
import Prisma from "../../lib/db";
import { handleError } from "../../lib/errorHandler";

export async function GET(req: NextRequest) {
  try {
    const users = await Prisma.user.findMany();
    return NextResponse.json(users);
  } catch (error) {
    return handleError(error, req);
  }
}
