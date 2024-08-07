import { NextRequest, NextResponse } from "next/server";
import Prisma from "../../lib/db";
import bcrypt from "bcrypt";

export const POST = async (req: NextRequest) => {
  try {
    const { name, username, email, password } = await req.json();
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
      return NextResponse.json({
        message: "User already exists",
      });
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
  }
};
