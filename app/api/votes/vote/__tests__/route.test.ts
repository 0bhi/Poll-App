import { POST, GET, DELETE } from '../route'
import { NextRequest } from 'next/server'
import Prisma from '@/app/_lib/db'

jest.mock('@/app/_lib/db', () => ({
  __esModule: true,
  default: {
    vote: {
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    notifications: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
  },
}))

describe('POST /api/votes/vote', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create a vote successfully', async () => {
    const mockVote = {
      id: 1,
      option_id: 1,
      user_id: 1,
      post_id: 1,
    }

    ;(Prisma.vote.findFirst as jest.Mock).mockResolvedValue(null) // No existing vote
    ;(Prisma.notifications.findFirst as jest.Mock).mockResolvedValue(null) // No existing notification
    ;(Prisma.vote.create as jest.Mock).mockResolvedValue(mockVote)
    ;(Prisma.notifications.create as jest.Mock).mockResolvedValue({})

    const req = new NextRequest('http://localhost:3000/api/votes/vote', {
      method: 'POST',
      body: JSON.stringify({
        user_id: 1,
        post_id: 1,
        option_id: 1,
        postAuthorId: 2,
        name: 'Test User',
      }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.res).toEqual(mockVote)
    expect(Prisma.vote.create).toHaveBeenCalledWith({
      data: {
        option_id: 1,
        user_id: 1,
        post_id: 1,
      },
    })
    expect(Prisma.notifications.create).toHaveBeenCalledWith({
      data: {
        text: 'Test User voted on your post',
        user_id: 2,
        type: 'VOTE',
        actorIds: [1],
      },
    })
  })

  it('should return error if vote already exists', async () => {
    const existingVote = {
      id: 1,
      option_id: 1,
      user_id: 1,
      post_id: 1,
    }

    ;(Prisma.vote.findFirst as jest.Mock).mockResolvedValue(existingVote)

    const req = new NextRequest('http://localhost:3000/api/votes/vote', {
      method: 'POST',
      body: JSON.stringify({
        user_id: 1,
        post_id: 1,
        option_id: 1,
        postAuthorId: 2,
        name: 'Test User',
      }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200) // Note: Your code returns 200, consider changing to 409
    expect(data.error).toBe('vote already exists')
    expect(Prisma.vote.create).not.toHaveBeenCalled()
  })

  it('should group notifications when multiple users vote', async () => {
    const existingNotification = {
      id: 1,
      user_id: 2,
      type: 'VOTE',
      actorIds: [3],
      text: 'User 3 voted on your post',
    }

    const mockUsers = [
      { name: 'User 1' },
      { name: 'User 3' },
    ]

    ;(Prisma.vote.findFirst as jest.Mock).mockResolvedValue(null)
    ;(Prisma.notifications.findFirst as jest.Mock).mockResolvedValue(existingNotification)
    ;(Prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers)
    ;(Prisma.vote.create as jest.Mock).mockResolvedValue({ id: 1 })
    ;(Prisma.notifications.update as jest.Mock).mockResolvedValue({})

    const req = new NextRequest('http://localhost:3000/api/votes/vote', {
      method: 'POST',
      body: JSON.stringify({
        user_id: 1,
        post_id: 1,
        option_id: 1,
        postAuthorId: 2,
        name: 'User 1',
      }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(Prisma.notifications.update).toHaveBeenCalled()
    expect(Prisma.notifications.create).not.toHaveBeenCalled()
  })

  it('should format notification text for 1 user', async () => {
    // Test scenario: No existing notification, first vote creates notification for 1 user
    const mockUsers = [{ name: 'User 1' }]

    ;(Prisma.vote.findFirst as jest.Mock).mockResolvedValue(null)
    ;(Prisma.notifications.findFirst as jest.Mock).mockResolvedValue(null) // No existing notification
    ;(Prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers)
    ;(Prisma.vote.create as jest.Mock).mockResolvedValue({ id: 1 })
    ;(Prisma.notifications.create as jest.Mock).mockResolvedValue({})

    const req = new NextRequest('http://localhost:3000/api/votes/vote', {
      method: 'POST',
      body: JSON.stringify({
        user_id: 1,
        post_id: 1,
        option_id: 1,
        postAuthorId: 2,
        name: 'User 1',
      }),
    })

    await POST(req)

    expect(Prisma.notifications.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          text: 'User 1 voted on your post',
        }),
      })
    )
  })

  it('should format notification text for 2 users', async () => {
    const existingNotification = {
      id: 1,
      user_id: 2,
      type: 'VOTE',
      actorIds: [1],
      text: 'User 1 voted on your post',
    }

    const mockUsers = [
      { name: 'User 1' },
      { name: 'User 3' },
    ]

    ;(Prisma.vote.findFirst as jest.Mock).mockResolvedValue(null)
    ;(Prisma.notifications.findFirst as jest.Mock).mockResolvedValue(existingNotification)
    ;(Prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers)
    ;(Prisma.vote.create as jest.Mock).mockResolvedValue({ id: 1 })
    ;(Prisma.notifications.update as jest.Mock).mockResolvedValue({})

    const req = new NextRequest('http://localhost:3000/api/votes/vote', {
      method: 'POST',
      body: JSON.stringify({
        user_id: 3,
        post_id: 1,
        option_id: 1,
        postAuthorId: 2,
        name: 'User 3',
      }),
    })

    await POST(req)

    expect(Prisma.notifications.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          text: 'User 1 and User 3 voted on your post',
        }),
      })
    )
  })

  it('should format notification text for 3+ users', async () => {
    const existingNotification = {
      id: 1,
      user_id: 2,
      type: 'VOTE',
      actorIds: [1, 3, 4, 5],
      text: 'User 1 voted on your post',
    }

    const mockUsers = [
      { name: 'User 4' },
      { name: 'User 5' },
    ]

    ;(Prisma.vote.findFirst as jest.Mock).mockResolvedValue(null)
    ;(Prisma.notifications.findFirst as jest.Mock).mockResolvedValue(existingNotification)
    ;(Prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers)
    ;(Prisma.vote.create as jest.Mock).mockResolvedValue({ id: 1 })
    ;(Prisma.notifications.update as jest.Mock).mockResolvedValue({})

    const req = new NextRequest('http://localhost:3000/api/votes/vote', {
      method: 'POST',
      body: JSON.stringify({
        user_id: 6,
        post_id: 1,
        option_id: 1,
        postAuthorId: 2,
        name: 'User 6',
      }),
    })

    await POST(req)

    expect(Prisma.notifications.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          text: expect.stringContaining('and'),
        }),
      })
    )
  })

  it('should handle database errors', async () => {
    ;(Prisma.vote.findFirst as jest.Mock).mockRejectedValue(
      new Error('Database error')
    )

    const req = new NextRequest('http://localhost:3000/api/votes/vote', {
      method: 'POST',
      body: JSON.stringify({
        user_id: 1,
        post_id: 1,
        option_id: 1,
        postAuthorId: 2,
        name: 'Test User',
      }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.error).toBe('vote creation failed')
  })
})

describe('GET /api/votes/vote', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return vote when found', async () => {
    const mockVote = {
      id: 1,
      option_id: 1,
      user_id: 1,
      post_id: 1,
    }

    ;(Prisma.vote.findFirst as jest.Mock).mockResolvedValue(mockVote)

    const req = new NextRequest('http://localhost:3000/api/votes/vote?userId=1&postId=1')
    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.vote).toEqual(mockVote)
  })

  it('should return null vote when not found', async () => {
    ;(Prisma.vote.findFirst as jest.Mock).mockResolvedValue(null)

    const req = new NextRequest('http://localhost:3000/api/votes/vote?userId=1&postId=1')
    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.vote).toBeNull()
  })

  it('should handle database errors', async () => {
    ;(Prisma.vote.findFirst as jest.Mock).mockRejectedValue(
      new Error('Database error')
    )

    const req = new NextRequest('http://localhost:3000/api/votes/vote?userId=1&postId=1')
    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.error).toBe('vote not found')
  })
})

describe('DELETE /api/votes/vote', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should delete a vote successfully', async () => {
    const mockDeletedVote = {
      id: 1,
      option_id: 1,
      user_id: 1,
      post_id: 1,
    }

    ;(Prisma.vote.delete as jest.Mock).mockResolvedValue(mockDeletedVote)

    const req = new NextRequest('http://localhost:3000/api/votes/vote', {
      method: 'DELETE',
      body: JSON.stringify({
        id: 1,
      }),
    })

    const response = await DELETE(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.res).toEqual(mockDeletedVote)
    expect(Prisma.vote.delete).toHaveBeenCalledWith({
      where: {
        id: 1,
      },
    })
  })

  it('should handle database errors', async () => {
    ;(Prisma.vote.delete as jest.Mock).mockRejectedValue(
      new Error('Database error')
    )

    const req = new NextRequest('http://localhost:3000/api/votes/vote', {
      method: 'DELETE',
      body: JSON.stringify({
        id: 1,
      }),
    })

    const response = await DELETE(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.error).toBe('vote deletion failed')
  })
})

