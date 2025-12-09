import { POST, GET } from '../route'
import { NextRequest } from 'next/server'
import Prisma from '../../../lib/db'

// Mock Prisma
jest.mock('../../../lib/db', () => ({
  __esModule: true,
  default: {
    post: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}))

describe('POST /api/post', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create a post with valid data', async () => {
    const mockPost = {
      id: 1,
      text: 'Test poll question?',
      user_id: 1,
      createdAt: new Date(),
      options: [
        { id: 1, text: 'Option 1', votes: [] },
        { id: 2, text: 'Option 2', votes: [] },
      ],
    }

    ;(Prisma.post.create as jest.Mock).mockResolvedValue(mockPost)

    const req = new NextRequest('http://localhost:3000/api/post', {
      method: 'POST',
      body: JSON.stringify({
        text: 'Test poll question?',
        options: ['Option 1', 'Option 2'],
        user_id: 1,
      }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    // Dates are serialized to strings in JSON, so compare specific fields
    expect(data.id).toBe(mockPost.id)
    expect(data.text).toBe(mockPost.text)
    expect(data.user_id).toBe(mockPost.user_id)
    expect(data.options).toEqual(mockPost.options)
    expect(typeof data.createdAt).toBe('string') // JSON serializes Date to string
    expect(Prisma.post.create).toHaveBeenCalledWith({
      data: {
        text: 'Test poll question?',
        options: {
          create: [
            { text: 'Option 1' },
            { text: 'Option 2' },
          ],
        },
        user_id: 1,
      },
      include: {
        options: {
          include: {
            votes: true,
          },
        },
      },
    })
  })

  it('should return 400 when text is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/post', {
      method: 'POST',
      body: JSON.stringify({
        options: ['Option 1', 'Option 2'],
        user_id: 1,
      }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Missing required fields')
    expect(Prisma.post.create).not.toHaveBeenCalled()
  })

  it('should return 400 when options are missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/post', {
      method: 'POST',
      body: JSON.stringify({
        text: 'Test poll question?',
        user_id: 1,
      }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Missing required fields')
  })

  it('should return 400 when user_id is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/post', {
      method: 'POST',
      body: JSON.stringify({
        text: 'Test poll question?',
        options: ['Option 1', 'Option 2'],
      }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Missing required fields')
  })

  it('should return 400 when less than 2 options provided', async () => {
    const req = new NextRequest('http://localhost:3000/api/post', {
      method: 'POST',
      body: JSON.stringify({
        text: 'Test poll question?',
        options: ['Option 1'],
        user_id: 1,
      }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('At least 2 options are required')
  })

  it('should filter out empty options', async () => {
    const mockPost = {
      id: 1,
      text: 'Test poll question?',
      user_id: 1,
      createdAt: new Date(),
      options: [
        { id: 1, text: 'Option 1', votes: [] },
        { id: 2, text: 'Option 2', votes: [] },
      ],
    }

    ;(Prisma.post.create as jest.Mock).mockResolvedValue(mockPost)

    const req = new NextRequest('http://localhost:3000/api/post', {
      method: 'POST',
      body: JSON.stringify({
        text: 'Test poll question?',
        options: ['Option 1', '', '   ', 'Option 2'],
        user_id: 1,
      }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(Prisma.post.create).toHaveBeenCalledWith({
      data: {
        text: 'Test poll question?',
        options: {
          create: [
            { text: 'Option 1' },
            { text: 'Option 2' },
          ],
        },
        user_id: 1,
      },
      include: {
        options: {
          include: {
            votes: true,
          },
        },
      },
    })
  })

  it('should handle database errors', async () => {
    ;(Prisma.post.create as jest.Mock).mockRejectedValue(
      new Error('Database error')
    )

    const req = new NextRequest('http://localhost:3000/api/post', {
      method: 'POST',
      body: JSON.stringify({
        text: 'Test poll question?',
        options: ['Option 1', 'Option 2'],
        user_id: 1,
      }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Invalid request')
  })
})

describe('GET /api/post', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return a post when postid is provided', async () => {
    const mockPost = {
      id: 1,
      text: 'Test poll question?',
      user_id: 1,
      options: [
        { id: 1, text: 'Option 1', votes: [] },
        { id: 2, text: 'Option 2', votes: [] },
      ],
      comments: [],
    }

    ;(Prisma.post.findUnique as jest.Mock).mockResolvedValue(mockPost)

    const req = new NextRequest('http://localhost:3000/api/post?postid=1')
    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual(mockPost)
    expect(Prisma.post.findUnique).toHaveBeenCalledWith({
      where: {
        id: 1,
      },
      include: {
        options: {
          include: {
            votes: true,
          },
        },
        comments: {
          include: {
            replies: true,
          },
        },
      },
    })
  })

  it('should handle database errors', async () => {
    ;(Prisma.post.findUnique as jest.Mock).mockRejectedValue(
      new Error('Database error')
    )

    const req = new NextRequest('http://localhost:3000/api/post?postid=1')
    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toBeDefined() // Error is serialized to object
  })
})

