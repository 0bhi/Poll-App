import { NextRequest, NextResponse } from "next/server";
import Prisma from "@/app/lib/db";
import {
  getMessagesQuerySchema,
  createMessageSchema,
  updateMessageSchema,
} from "@/app/lib/schemas";
import { validateQuery, validateBody } from "@/app/lib/validation";
import { handleError } from "@/app/lib/errorHandler";
import { NotFoundError } from "@/app/lib/errors";
import { withAuth } from "@/app/lib/authMiddleware";
import { withRateLimit, writeRateLimiter } from "@/app/lib/rateLimit";
import { successResponse, errorResponse } from "@/app/lib/apiResponse";

export async function GET(req: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await withRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  return withAuth(async (req: NextRequest, userId: number) => {
    try {
      const validation = validateQuery(req, getMessagesQuerySchema);
      if (!validation.success) {
        return validation.error;
      }

      const { conversation_id, limit, cursor } = validation.data;

      // Verify user is a participant in the conversation
      const conversation = await Prisma.conversation.findFirst({
        where: {
          id: conversation_id,
          OR: [{ participant1Id: userId }, { participant2Id: userId }],
        },
      });

      if (!conversation) {
        throw new NotFoundError("Conversation or access denied");
      }

      const findManyArgs: any = {
        where: {
          conversationId: conversation_id,
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              username: true,
              profilePicture: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      };

      if (cursor) {
        findManyArgs.skip = 1;
        findManyArgs.cursor = { id: cursor };
      }

      const messages = await Prisma.message.findMany(findManyArgs);
      const nextCursor =
        messages.length === limit ? messages[messages.length - 1].id : null;

      // Reverse the order to show oldest first
      const reversedMessages = messages.reverse();

      return successResponse(reversedMessages, { nextCursor });
    } catch (error) {
      return handleError(error, req);
    }
  })(req);
}

export async function POST(req: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await withRateLimit(req, writeRateLimiter);
  if (rateLimitResponse) return rateLimitResponse;

  return withAuth(async (req: NextRequest, userId: number) => {
    try {
      const validation = await validateBody(req, createMessageSchema);
      if (!validation.success) {
        return validation.error;
      }

      const { conversationId, senderId, content, messageType } =
        validation.data;
      const parsedConversationId =
        typeof conversationId === "string"
          ? parseInt(conversationId)
          : conversationId;
      const parsedSenderId =
        typeof senderId === "string" ? parseInt(senderId) : senderId;

      // Verify the authenticated user matches the senderId
      if (parsedSenderId !== userId) {
        return errorResponse(
          "Unauthorized: User ID mismatch",
          "UNAUTHORIZED",
          undefined,
          403
        );
      }

      // Verify conversation exists and user is a participant
      const conversation = await Prisma.conversation.findFirst({
        where: {
          id: parsedConversationId,
          OR: [
            { participant1Id: parsedSenderId },
            { participant2Id: parsedSenderId },
          ],
        },
      });

      if (!conversation) {
        throw new NotFoundError("Conversation or user is not a participant");
      }

      // Create the message
      const message = await Prisma.message.create({
        data: {
          conversationId: parsedConversationId,
          senderId: parsedSenderId,
          content,
          messageType: messageType as "TEXT" | "IMAGE" | "POLL_LINK" | "SYSTEM",
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              username: true,
              profilePicture: true,
            },
          },
        },
      });

      // Update conversation's updatedAt timestamp
      await Prisma.conversation.update({
        where: { id: parsedConversationId },
        data: { updatedAt: new Date() },
      });

      // Create notification for the other participant
      const otherParticipantId =
        conversation.participant1Id === parsedSenderId
          ? conversation.participant2Id
          : conversation.participant1Id;

      await Prisma.notifications.create({
        data: {
          text: `New message from ${message.sender.name}`,
          user_id: otherParticipantId,
          type: "MESSAGE",
          actorIds: [parsedSenderId],
        },
      });

      // Broadcast message via socket server
      try {
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
        await fetch(`${socketUrl}/broadcast-message`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            conversationId: parsedConversationId,
          }),
        });
      } catch (error) {
        // Log error but don't fail the request - message is already saved
        console.error("Error broadcasting message via socket:", error);
      }

      return successResponse(message);
    } catch (error) {
      return handleError(error, req);
    }
  })(req);
}

export async function PUT(req: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await withRateLimit(req, writeRateLimiter);
  if (rateLimitResponse) return rateLimitResponse;

  return withAuth(async (req: NextRequest, userId: number) => {
    try {
      const validation = await validateBody(req, updateMessageSchema);
      if (!validation.success) {
        return validation.error;
      }

      const { messageId, isRead } = validation.data;
      const parsedMessageId =
        typeof messageId === "string" ? parseInt(messageId) : messageId;

      // Verify the message belongs to a conversation the user is part of
      const message = await Prisma.message.findUnique({
        where: { id: parsedMessageId },
        include: { conversation: true },
      });

      if (!message) {
        throw new NotFoundError("Message");
      }

      // Verify user is a participant in the conversation
      if (
        message.conversation.participant1Id !== userId &&
        message.conversation.participant2Id !== userId
      ) {
        return errorResponse(
          "Unauthorized: You can only update messages in your conversations",
          "UNAUTHORIZED",
          undefined,
          403
        );
      }

      const updatedMessage = await Prisma.message.update({
        where: { id: parsedMessageId },
        data: { isRead },
      });

      return successResponse(updatedMessage);
    } catch (error) {
      return handleError(error, req);
    }
  })(req);
}
