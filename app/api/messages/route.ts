import { NextRequest, NextResponse } from "next/server";
import Prisma from "@/app/lib/db";

export async function GET(req: NextRequest) {
  try {
    const conversationId = req.nextUrl.searchParams.get("conversation_id");
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "50");
    const cursor = req.nextUrl.searchParams.get("cursor");

    if (!conversationId) {
      return NextResponse.json(
        { error: "Conversation ID is required" },
        { status: 400 }
      );
    }

    const findManyArgs: any = {
      where: {
        conversationId: parseInt(conversationId),
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
      findManyArgs.cursor = { id: parseInt(cursor) };
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
    const { conversationId, senderId, content, messageType = "TEXT" } = await req.json();

    if (!conversationId || !senderId || !content) {
      return NextResponse.json(
        { error: "Conversation ID, sender ID, and content are required" },
        { status: 400 }
      );
    }

    // Verify conversation exists and user is a participant
    const conversation = await Prisma.conversation.findFirst({
      where: {
        id: parseInt(conversationId),
        OR: [
          { participant1Id: parseInt(senderId) },
          { participant2Id: parseInt(senderId) },
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
        conversationId: parseInt(conversationId),
        senderId: parseInt(senderId),
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
      where: { id: parseInt(conversationId) },
      data: { updatedAt: new Date() },
    });

    // Create notification for the other participant
    const otherParticipantId = 
      conversation.participant1Id === parseInt(senderId)
        ? conversation.participant2Id
        : conversation.participant1Id;

    await Prisma.notifications.create({
      data: {
        text: `New message from ${message.sender.name}`,
        user_id: otherParticipantId,
        type: "MESSAGE",
        actorIds: [parseInt(senderId)],
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
    const { messageId, isRead } = await req.json();

    if (messageId === undefined || isRead === undefined) {
      return NextResponse.json(
        { error: "Message ID and read status are required" },
        { status: 400 }
      );
    }

    const message = await Prisma.message.update({
      where: { id: parseInt(messageId) },
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
