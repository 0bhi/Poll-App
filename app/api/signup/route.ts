import { NextRequest, NextResponse } from "next/server";
import Prisma from "../../_lib/db";
import bcrypt from "bcrypt";
import { signupSchema } from "../../_lib/schemas";
import { validateBody } from "../../_lib/validation";
import { handleError } from "../../_lib/errorHandler";
import { ConflictError } from "../../_lib/errors";
import { withRateLimit, authRateLimiter } from "../../_lib/rateLimit";
import { successResponse } from "../../_lib/apiResponse";

export const POST = async (req: NextRequest) => {
  // Apply stricter rate limiting for signup
  const rateLimitResponse = await withRateLimit(req, authRateLimiter);
  if (rateLimitResponse) return rateLimitResponse;

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
      throw new ConflictError("User with this username or email already exists");
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

    return successResponse(user);
  } catch (error) {
    return handleError(error, req);
  }
};
