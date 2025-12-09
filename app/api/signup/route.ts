import { NextRequest, NextResponse } from "next/server";
import Prisma from "../../lib/db";
import bcrypt from "bcrypt";
import { signupSchema } from "../../lib/schemas";
import { validateBody } from "../../lib/validation";

export const POST = async (req: NextRequest) => {
  try {
    const validation = await validateBody(req, signupSchema);
    if (!validation.success) {
      return validation.error;
    }

    const { name, username, email, password } = validation.data;
    const existingUser = await Prisma.user.findFirst({
      where: {
        OR: [
          {
            username: username,
          },
          {
            email: email,
          },
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 409 }
      );
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await Prisma.user.create({
      data: {
        name,
        username,
        email,
        password: hashedPassword,
      },
    });

    console.log(user);
    return NextResponse.json(user);
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
};
