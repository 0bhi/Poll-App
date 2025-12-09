import { GET, POST } from '../route'
import { NextRequest } from 'next/server'
import Prisma from '@/app/lib/db'

jest.mock('@/app/lib/db', () => ({
  __esModule: true,
  default: {
    postVote: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}))

describe('GET /api/postVote', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return vote type when vote exists', async () => {
    const mockVote = {
      id: 1,
      user_id: 1,
      post_id: 1,
      type: 'UPVOTE',
    }

    ;(Prisma.postVote.findUnique as jest.Mock).mockResolvedValue(mockVote)

    const req = new NextRequest('http://localhost:3000/api/postVote?user_id=1&post_id=1')
    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.type).toBe('UPVOTE')
  })

  it('should return null when vote does not exist', async () => {
    ;(Prisma.postVote.findUnique as jest.Mock).mockResolvedValue(null)

    const req = new NextRequest('http://localhost:3000/api/postVote?user_id=1&post_id=1')
    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.type).toBeNull()
  })

  it('should return 400 when user_id is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/postVote?post_id=1')
    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Missing user_id or post_id')
  })

  it('should return 400 when post_id is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/postVote?user_id=1')
    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Missing user_id or post_id')
  })

  it('should handle database errors', async () => {
    ;(Prisma.postVote.findUnique as jest.Mock).mockRejectedValue(
      new Error('Database error')
    )

    const req = new NextRequest('http://localhost:3000/api/postVote?user_id=1&post_id=1')
    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch post vote status')
  })
})

describe('POST /api/postVote', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create an upvote', async () => {
    ;(Prisma.postVote.findUnique as jest.Mock).mockResolvedValue(null)
    ;(Prisma.postVote.create as jest.Mock).mockResolvedValue({
      id: 1,
      user_id: 1,
      post_id: 1,
      type: 'UPVOTE',
    })

    const req = new NextRequest('http://localhost:3000/api/postVote', {
      method: 'POST',
      body: JSON.stringify({
        user_id: 1,
        post_id: 1,
        type: 'UPVOTE',
      }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe('Upvoted')
    expect(Prisma.postVote.create).toHaveBeenCalledWith({
      data: {
        user_id: 1,
        post_id: 1,
        type: 'UPVOTE',
      },
    })
  })

  it('should create a downvote', async () => {
    ;(Prisma.postVote.findUnique as jest.Mock).mockResolvedValue(null)
    ;(Prisma.postVote.create as jest.Mock).mockResolvedValue({
      id: 1,
      user_id: 1,
      post_id: 1,
      type: 'DOWNVOTE',
    })

    const req = new NextRequest('http://localhost:3000/api/postVote', {
      method: 'POST',
      body: JSON.stringify({
        user_id: 1,
        post_id: 1,
        type: 'DOWNVOTE',
      }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe('Downvoted')
    expect(Prisma.postVote.create).toHaveBeenCalledWith({
      data: {
        user_id: 1,
        post_id: 1,
        type: 'DOWNVOTE',
      },
    })
  })

  it('should remove vote when type is REMOVE', async () => {
    ;(Prisma.postVote.deleteMany as jest.Mock).mockResolvedValue({ count: 1 })

    const req = new NextRequest('http://localhost:3000/api/postVote', {
      method: 'POST',
      body: JSON.stringify({
        user_id: 1,
        post_id: 1,
        type: 'REMOVE',
      }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe('Vote removed')
    expect(Prisma.postVote.deleteMany).toHaveBeenCalledWith({
      where: {
        user_id: 1,
        post_id: 1,
      },
    })
  })

  it('should change from upvote to downvote', async () => {
    const existingVote = {
      id: 1,
      user_id: 1,
      post_id: 1,
      type: 'UPVOTE',
    }

    ;(Prisma.postVote.findUnique as jest.Mock).mockResolvedValue(existingVote)
    ;(Prisma.postVote.update as jest.Mock).mockResolvedValue({
      ...existingVote,
      type: 'DOWNVOTE',
    })

    const req = new NextRequest('http://localhost:3000/api/postVote', {
      method: 'POST',
      body: JSON.stringify({
        user_id: 1,
        post_id: 1,
        type: 'DOWNVOTE',
      }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe('Changed vote to downvote')
    expect(Prisma.postVote.update).toHaveBeenCalledWith({
      where: {
        user_id_post_id: {
          user_id: 1,
          post_id: 1,
        },
      },
      data: {
        type: 'DOWNVOTE',
      },
    })
  })

  it('should change from downvote to upvote', async () => {
    const existingVote = {
      id: 1,
      user_id: 1,
      post_id: 1,
      type: 'DOWNVOTE',
    }

    ;(Prisma.postVote.findUnique as jest.Mock).mockResolvedValue(existingVote)
    ;(Prisma.postVote.update as jest.Mock).mockResolvedValue({
      ...existingVote,
      type: 'UPVOTE',
    })

    const req = new NextRequest('http://localhost:3000/api/postVote', {
      method: 'POST',
      body: JSON.stringify({
        user_id: 1,
        post_id: 1,
        type: 'UPVOTE',
      }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe('Changed vote to upvote')
    expect(Prisma.postVote.update).toHaveBeenCalledWith({
      where: {
        user_id_post_id: {
          user_id: 1,
          post_id: 1,
        },
      },
      data: {
        type: 'UPVOTE',
      },
    })
  })

  it('should prevent duplicate same-type vote', async () => {
    const existingVote = {
      id: 1,
      user_id: 1,
      post_id: 1,
      type: 'UPVOTE',
    }

    ;(Prisma.postVote.findUnique as jest.Mock).mockResolvedValue(existingVote)

    const req = new NextRequest('http://localhost:3000/api/postVote', {
      method: 'POST',
      body: JSON.stringify({
        user_id: 1,
        post_id: 1,
        type: 'UPVOTE',
      }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.message).toBe('Already upvoted')
    expect(Prisma.postVote.create).not.toHaveBeenCalled()
    expect(Prisma.postVote.update).not.toHaveBeenCalled()
  })

  it('should return 400 when user_id is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/postVote', {
      method: 'POST',
      body: JSON.stringify({
        post_id: 1,
        type: 'UPVOTE',
      }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Missing user_id, post_id, or type')
  })

  it('should return 400 when post_id is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/postVote', {
      method: 'POST',
      body: JSON.stringify({
        user_id: 1,
        type: 'UPVOTE',
      }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Missing user_id, post_id, or type')
  })

  it('should return 400 when type is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/postVote', {
      method: 'POST',
      body: JSON.stringify({
        user_id: 1,
        post_id: 1,
      }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Missing user_id, post_id, or type')
  })

  it('should handle database errors', async () => {
    ;(Prisma.postVote.findUnique as jest.Mock).mockRejectedValue(
      new Error('Database error')
    )

    const req = new NextRequest('http://localhost:3000/api/postVote', {
      method: 'POST',
      body: JSON.stringify({
        user_id: 1,
        post_id: 1,
        type: 'UPVOTE',
      }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Vote operation failed')
  })
})

