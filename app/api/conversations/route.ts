import { NextRequest, NextResponse } from "next/server";
import Prisma from "@/app/lib/db";

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("user_id");
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const conversations = await Prisma.conversation.findMany({
      where: {
        OR: [
          { participant1Id: parseInt(userId) },
          { participant2Id: parseInt(userId) },
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
          conversation.participant1Id === parseInt(userId)
            ? conversation.participant2
            : conversation.participant1;

        // Count unread messages
        const unreadCount = await Prisma.message.count({
          where: {
            conversationId: conversation.id,
            senderId: { not: parseInt(userId) },
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
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { participant1Id, participant2Id } = await req.json();

    if (!participant1Id || !participant2Id) {
      return NextResponse.json(
        { error: "Both participant IDs are required" },
        { status: 400 }
      );
    }

    // Check if conversation already exists
    const existingConversation = await Prisma.conversation.findFirst({
      where: {
        OR: [
          {
            participant1Id: parseInt(participant1Id),
            participant2Id: parseInt(participant2Id),
          },
          {
            participant1Id: parseInt(participant2Id),
            participant2Id: parseInt(participant1Id),
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
        participant1Id: parseInt(participant1Id),
        participant2Id: parseInt(participant2Id),
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
    console.error("Error creating conversation:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}
