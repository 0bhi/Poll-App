import { NextRequest, NextResponse } from "next/server";
import Prisma from "@/app/lib/db";
import { getMessagesQuerySchema, createMessageSchema, updateMessageSchema } from "@/app/lib/schemas";
import { validateQuery, validateBody } from "@/app/lib/validation";

export async function GET(req: NextRequest) {
  try {
    const validation = validateQuery(req, getMessagesQuerySchema);
    if (!validation.success) {
      return validation.error;
    }

    const { conversation_id, limit, cursor } = validation.data;

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
    const nextCursor = messages.length === limit ? messages[messages.length - 1].id : null;

    // Reverse the order to show oldest first
    const reversedMessages = messages.reverse();

    return NextResponse.json({ 
      messages: reversedMessages, 
      nextCursor 
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const validation = await validateBody(req, createMessageSchema);
    if (!validation.success) {
      return validation.error;
    }

    const { conversationId, senderId, content, messageType } = validation.data;
    const parsedConversationId = typeof conversationId === "string" ? parseInt(conversationId) : conversationId;
    const parsedSenderId = typeof senderId === "string" ? parseInt(senderId) : senderId;

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
      return NextResponse.json(
        { error: "Conversation not found or user not a participant" },
        { status: 404 }
      );
    }

    // Create the message
    const message = await Prisma.message.create({
      data: {
        conversationId: parsedConversationId,
        senderId: parsedSenderId,
        content,
        messageType,
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

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const validation = await validateBody(req, updateMessageSchema);
    if (!validation.success) {
      return validation.error;
    }

    const { messageId, isRead } = validation.data;
    const parsedMessageId = typeof messageId === "string" ? parseInt(messageId) : messageId;

    const message = await Prisma.message.update({
      where: { id: parsedMessageId },
      data: { isRead },
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Error updating message:", error);
    return NextResponse.json(
      { error: "Failed to update message" },
      { status: 500 }
    );
  }
}
