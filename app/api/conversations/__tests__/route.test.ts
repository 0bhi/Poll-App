import { GET, POST } from '../route'
import { NextRequest } from 'next/server'
import Prisma from '@/app/lib/db'

jest.mock('@/app/lib/db', () => ({
  __esModule: true,
  default: {
    conversation: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    message: {
      count: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
  },
}))

describe('POST /api/conversations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create a new conversation', async () => {
    const mockConversation = {
      id: 1,
      participant1Id: 1,
      participant2Id: 2,
      participant1: {
        id: 1,
        name: 'User 1',
        username: 'user1',
        profilePicture: 'pic1.jpg',
      },
      participant2: {
        id: 2,
        name: 'User 2',
        username: 'user2',
        profilePicture: 'pic2.jpg',
      },
    }

    ;(Prisma.conversation.findFirst as jest.Mock).mockResolvedValue(null)
    ;(Prisma.conversation.create as jest.Mock).mockResolvedValue(mockConversation)

    const req = new NextRequest('http://localhost:3000/api/conversations', {
      method: 'POST',
      body: JSON.stringify({
        participant1Id: 1,
        participant2Id: 2,
      }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.conversation).toEqual(mockConversation)
    expect(Prisma.conversation.create).toHaveBeenCalledWith({
      data: {
        participant1Id: 1,
        participant2Id: 2,
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
    })
  })

  it('should return existing conversation when duplicate', async () => {
    const existingConversation = {
      id: 1,
      participant1Id: 1,
      participant2Id: 2,
    }

    ;(Prisma.conversation.findFirst as jest.Mock).mockResolvedValue(existingConversation)

    const req = new NextRequest('http://localhost:3000/api/conversations', {
      method: 'POST',
      body: JSON.stringify({
        participant1Id: 1,
        participant2Id: 2,
      }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.conversation).toEqual(existingConversation)
    expect(Prisma.conversation.create).not.toHaveBeenCalled()
  })

  it('should handle reverse participant order (duplicate check)', async () => {
    const existingConversation = {
      id: 1,
      participant1Id: 2,
      participant2Id: 1,
    }

    ;(Prisma.conversation.findFirst as jest.Mock).mockResolvedValue(existingConversation)

    const req = new NextRequest('http://localhost:3000/api/conversations', {
      method: 'POST',
      body: JSON.stringify({
        participant1Id: 1,
        participant2Id: 2,
      }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.conversation).toEqual(existingConversation)
    expect(Prisma.conversation.findFirst).toHaveBeenCalledWith({
      where: {
        OR: [
          {
            participant1Id: 1,
            participant2Id: 2,
          },
          {
            participant1Id: 2,
            participant2Id: 1,
          },
        ],
      },
    })
  })

  it('should return 400 when participant1Id is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/conversations', {
      method: 'POST',
      body: JSON.stringify({
        participant2Id: 2,
      }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Both participant IDs are required')
    expect(Prisma.conversation.create).not.toHaveBeenCalled()
  })

  it('should return 400 when participant2Id is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/conversations', {
      method: 'POST',
      body: JSON.stringify({
        participant1Id: 1,
      }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Both participant IDs are required')
  })

  it('should handle database errors', async () => {
    ;(Prisma.conversation.findFirst as jest.Mock).mockResolvedValue(null)
    ;(Prisma.conversation.create as jest.Mock).mockRejectedValue(
      new Error('Database error')
    )

    const req = new NextRequest('http://localhost:3000/api/conversations', {
      method: 'POST',
      body: JSON.stringify({
        participant1Id: 1,
        participant2Id: 2,
      }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to create conversation')
  })
})

describe('GET /api/conversations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return conversations for a user', async () => {
    const mockConversations = [
      {
        id: 1,
        participant1Id: 1,
        participant2Id: 2,
        participant1: {
          id: 1,
          name: 'User 1',
          username: 'user1',
          profilePicture: 'pic1.jpg',
        },
        participant2: {
          id: 2,
          name: 'User 2',
          username: 'user2',
          profilePicture: 'pic2.jpg',
        },
        messages: [],
        updatedAt: new Date(),
      },
    ]

    ;(Prisma.conversation.findMany as jest.Mock).mockResolvedValue(mockConversations)
    ;(Prisma.message.count as jest.Mock).mockResolvedValue(0)

    const req = new NextRequest('http://localhost:3000/api/conversations?user_id=1')
    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.conversations).toBeDefined()
    expect(Array.isArray(data.conversations)).toBe(true)
  })

  it('should return 400 when user_id is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/conversations')
    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('User ID is required')
  })

  it('should calculate unread count for each conversation', async () => {
    const mockConversations = [
      {
        id: 1,
        participant1Id: 1,
        participant2Id: 2,
        participant1: { id: 1, name: 'User 1', username: 'user1', profilePicture: 'pic1.jpg' },
        participant2: { id: 2, name: 'User 2', username: 'user2', profilePicture: 'pic2.jpg' },
        messages: [],
        updatedAt: new Date(),
      },
    ]

    ;(Prisma.conversation.findMany as jest.Mock).mockResolvedValue(mockConversations)
    ;(Prisma.message.count as jest.Mock).mockResolvedValue(3)

    const req = new NextRequest('http://localhost:3000/api/conversations?user_id=1')
    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(Prisma.message.count).toHaveBeenCalledWith({
      where: {
        conversationId: 1,
        senderId: { not: 1 },
        isRead: false,
      },
    })
  })

  it('should handle database errors', async () => {
    ;(Prisma.conversation.findMany as jest.Mock).mockRejectedValue(
      new Error('Database error')
    )

    const req = new NextRequest('http://localhost:3000/api/conversations?user_id=1')
    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch conversations')
  })
})

