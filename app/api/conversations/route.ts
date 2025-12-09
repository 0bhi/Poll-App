import { NextRequest, NextResponse } from "next/server";
import Prisma from "@/app/lib/db";
import { getConversationsQuerySchema, createConversationSchema } from "@/app/lib/schemas";
import { validateQuery, validateBody } from "@/app/lib/validation";
import { handleError } from "@/app/lib/errorHandler";

export async function GET(req: NextRequest) {
  try {
    const validation = validateQuery(req, getConversationsQuerySchema);
    if (!validation.success) {
      return validation.error;
    }

    const { user_id: userId } = validation.data;

    const conversations = await Prisma.conversation.findMany({
      where: {
        OR: [
          { participant1Id: userId },
          { participant2Id: userId },
        ],
      },
      include: {
        participant1: {
          select: {
            id: true,
            name: true,
            username: true,
            profilePicture: true,
          },
        },
        participant2: {
          select: {
            id: true,
            name: true,
            username: true,
            profilePicture: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Transform conversations to include unread count and other user info
    const transformedConversations = await Promise.all(
      conversations.map(async (conversation) => {
        const otherUser =
          conversation.participant1Id === userId
            ? conversation.participant2
            : conversation.participant1;

        // Count unread messages
        const unreadCount = await Prisma.message.count({
          where: {
            conversationId: conversation.id,
            senderId: { not: userId },
            isRead: false,
          },
        });

        return {
          id: conversation.id,
          otherUser,
          lastMessage: conversation.messages[0] || null,
          unreadCount,
          updatedAt: conversation.updatedAt,
        };
      })
    );

    return NextResponse.json({ conversations: transformedConversations });
  } catch (error) {
    return handleError(error, req);
  }
}

export async function POST(req: NextRequest) {
  try {
    const validation = await validateBody(req, createConversationSchema);
    if (!validation.success) {
      return validation.error;
    }

    const { participant1Id, participant2Id } = validation.data;
    const parsedParticipant1Id = typeof participant1Id === "string" ? parseInt(participant1Id) : participant1Id;
    const parsedParticipant2Id = typeof participant2Id === "string" ? parseInt(participant2Id) : participant2Id;

    // Check if conversation already exists
    const existingConversation = await Prisma.conversation.findFirst({
      where: {
        OR: [
          {
            participant1Id: parsedParticipant1Id,
            participant2Id: parsedParticipant2Id,
          },
          {
            participant1Id: parsedParticipant2Id,
            participant2Id: parsedParticipant1Id,
          },
        ],
      },
    });

    if (existingConversation) {
      return NextResponse.json({ conversation: existingConversation });
    }

    // Create new conversation
    const conversation = await Prisma.conversation.create({
      data: {
        participant1Id: parsedParticipant1Id,
        participant2Id: parsedParticipant2Id,
      },
      include: {
        participant1: {
          select: {
            id: true,
            name: true,
            username: true,
            profilePicture: true,
          },
        },
        participant2: {
          select: {
            id: true,
            name: true,
            username: true,
            profilePicture: true,
          },
        },
      },
    });

    return NextResponse.json({ conversation });
  } catch (error) {
    return handleError(error, req);
  }
}
