import { GET, POST, PUT } from '../route'
import { NextRequest } from 'next/server'
import Prisma from '@/app/lib/db'

jest.mock('@/app/lib/db', () => ({
  __esModule: true,
  default: {
    message: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    conversation: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    notifications: {
      create: jest.fn(),
    },
  },
}))

describe('POST /api/messages', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create a message successfully', async () => {
    const mockConversation = {
      id: 1,
      participant1Id: 1,
      participant2Id: 2,
    }

    const mockMessage = {
      id: 1,
      conversationId: 1,
      senderId: 1,
      content: 'Hello',
      messageType: 'TEXT',
      sender: {
        id: 1,
        name: 'User 1',
        username: 'user1',
        profilePicture: 'pic.jpg',
      },
    }

    ;(Prisma.conversation.findFirst as jest.Mock).mockResolvedValue(mockConversation)
    ;(Prisma.message.create as jest.Mock).mockResolvedValue(mockMessage)
    ;(Prisma.conversation.update as jest.Mock).mockResolvedValue({})
    ;(Prisma.notifications.create as jest.Mock).mockResolvedValue({})

    const req = new NextRequest('http://localhost:3000/api/messages', {
      method: 'POST',
      body: JSON.stringify({
        conversationId: 1,
        senderId: 1,
        content: 'Hello',
        messageType: 'TEXT',
      }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toEqual(mockMessage)
    expect(Prisma.message.create).toHaveBeenCalledWith({
      data: {
        conversationId: 1,
        senderId: 1,
        content: 'Hello',
        messageType: 'TEXT',
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
    })
    expect(Prisma.conversation.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { updatedAt: expect.any(Date) },
    })
  })

  it('should create notification for recipient', async () => {
    const mockConversation = {
      id: 1,
      participant1Id: 1,
      participant2Id: 2,
    }

    const mockMessage = {
      id: 1,
      conversationId: 1,
      senderId: 1,
      content: 'Hello',
      sender: {
        id: 1,
        name: 'User 1',
        username: 'user1',
        profilePicture: 'pic.jpg',
      },
    }

    ;(Prisma.conversation.findFirst as jest.Mock).mockResolvedValue(mockConversation)
    ;(Prisma.message.create as jest.Mock).mockResolvedValue(mockMessage)
    ;(Prisma.conversation.update as jest.Mock).mockResolvedValue({})
    ;(Prisma.notifications.create as jest.Mock).mockResolvedValue({})

    const req = new NextRequest('http://localhost:3000/api/messages', {
      method: 'POST',
      body: JSON.stringify({
        conversationId: 1,
        senderId: 1,
        content: 'Hello',
      }),
    })

    await POST(req)

    expect(Prisma.notifications.create).toHaveBeenCalledWith({
      data: {
        text: 'New message from User 1',
        user_id: 2, // Other participant
        type: 'MESSAGE',
        actorIds: [1],
      },
    })
  })

  it('should return 400 when conversationId is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/messages', {
      method: 'POST',
      body: JSON.stringify({
        senderId: 1,
        content: 'Hello',
      }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Conversation ID, sender ID, and content are required')
  })

  it('should return 400 when senderId is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/messages', {
      method: 'POST',
      body: JSON.stringify({
        conversationId: 1,
        content: 'Hello',
      }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Conversation ID, sender ID, and content are required')
  })

  it('should return 400 when content is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/messages', {
      method: 'POST',
      body: JSON.stringify({
        conversationId: 1,
        senderId: 1,
      }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Conversation ID, sender ID, and content are required')
  })

  it('should return 404 when conversation not found', async () => {
    ;(Prisma.conversation.findFirst as jest.Mock).mockResolvedValue(null)

    const req = new NextRequest('http://localhost:3000/api/messages', {
      method: 'POST',
      body: JSON.stringify({
        conversationId: 999,
        senderId: 1,
        content: 'Hello',
      }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Conversation not found or user not a participant')
    expect(Prisma.message.create).not.toHaveBeenCalled()
  })

  it('should return 404 when user is not a participant', async () => {
    ;(Prisma.conversation.findFirst as jest.Mock).mockResolvedValue(null)

    const req = new NextRequest('http://localhost:3000/api/messages', {
      method: 'POST',
      body: JSON.stringify({
        conversationId: 1,
        senderId: 999, // Not a participant
        content: 'Hello',
      }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Conversation not found or user not a participant')
  })

  it('should handle database errors', async () => {
    const mockConversation = {
      id: 1,
      participant1Id: 1,
      participant2Id: 2,
    }

    ;(Prisma.conversation.findFirst as jest.Mock).mockResolvedValue(mockConversation)
    ;(Prisma.message.create as jest.Mock).mockRejectedValue(
      new Error('Database error')
    )

    const req = new NextRequest('http://localhost:3000/api/messages', {
      method: 'POST',
      body: JSON.stringify({
        conversationId: 1,
        senderId: 1,
        content: 'Hello',
      }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to send message')
  })
})

describe('GET /api/messages', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return messages with default pagination', async () => {
    const mockMessages = [
      { id: 2, content: 'Message 2', sender: {} },
      { id: 1, content: 'Message 1', sender: {} },
    ]

    ;(Prisma.message.findMany as jest.Mock).mockResolvedValue(mockMessages)

    const req = new NextRequest('http://localhost:3000/api/messages?conversation_id=1')
    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    // Route reverses messages, so [2, 1] becomes [1, 2]
    expect(data.messages).toEqual([{ id: 1, content: 'Message 1', sender: {} }, { id: 2, content: 'Message 2', sender: {} }])
    expect(data.nextCursor).toBeNull()
  })

  it('should handle cursor-based pagination', async () => {
    const mockMessages = Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      content: `Message ${i + 1}`,
      sender: {},
    }))

    ;(Prisma.message.findMany as jest.Mock).mockResolvedValue(mockMessages)

    const req = new NextRequest('http://localhost:3000/api/messages?conversation_id=1&limit=50')
    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.nextCursor).toBe(50)
  })

  it('should return 400 when conversation_id is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/messages')
    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Conversation ID is required')
  })
})

describe('PUT /api/messages', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should update message read status', async () => {
    const mockMessage = {
      id: 1,
      isRead: true,
    }

    ;(Prisma.message.update as jest.Mock).mockResolvedValue(mockMessage)

    const req = new NextRequest('http://localhost:3000/api/messages', {
      method: 'PUT',
      body: JSON.stringify({
        messageId: 1,
        isRead: true,
      }),
    })

    const response = await PUT(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toEqual(mockMessage)
    expect(Prisma.message.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { isRead: true },
    })
  })

  it('should return 400 when messageId is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/messages', {
      method: 'PUT',
      body: JSON.stringify({
        isRead: true,
      }),
    })

    const response = await PUT(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Message ID and read status are required')
  })

  it('should return 400 when isRead is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/messages', {
      method: 'PUT',
      body: JSON.stringify({
        messageId: 1,
      }),
    })

    const response = await PUT(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Message ID and read status are required')
  })
})

