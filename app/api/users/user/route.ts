import { NextRequest, NextResponse } from "next/server";
import Prisma from "@/app/lib/db";
import { getUserQuerySchema } from "@/app/lib/schemas";
import { validateQuery } from "@/app/lib/validation";
import { handleError } from "@/app/lib/errorHandler";
import { NotFoundError } from "@/app/lib/errors";

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

    if (!user) {
      throw new NotFoundError("User");
    }

    return NextResponse.json(user);
  } catch (error) {
    return handleError(error, req);
  }
}
