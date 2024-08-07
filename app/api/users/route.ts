import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import Prisma from "../../lib/db";

export async function GET() {
  const users = await Prisma.user.findMany();
  return NextResponse.json(users);
}
