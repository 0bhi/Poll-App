import { POST } from '../route'
import { NextRequest } from 'next/server'
import Prisma from '../../../lib/db'
import bcrypt from 'bcrypt'

jest.mock('../../../lib/db', () => ({
  __esModule: true,
  default: {
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}))

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}))

describe('POST /api/signup', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create a user successfully', async () => {
    const mockUser = {
      id: 1,
      name: 'Test User',
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashedPassword',
    }

    ;(Prisma.user.findFirst as jest.Mock).mockResolvedValue(null) // No existing user
    ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword')
    ;(Prisma.user.create as jest.Mock).mockResolvedValue(mockUser)

    const req = new NextRequest('http://localhost:3000/api/signup', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual(mockUser)
    expect(Prisma.user.findFirst).toHaveBeenCalledWith({
      where: {
        OR: [
          { username: 'testuser' },
          { email: 'test@example.com' },
        ],
      },
    })
    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10)
    expect(Prisma.user.create).toHaveBeenCalledWith({
      data: {
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedPassword',
      },
    })
  })

  it('should return error when username already exists', async () => {
    const existingUser = {
      id: 1,
      username: 'testuser',
      email: 'other@example.com',
    }

    ;(Prisma.user.findFirst as jest.Mock).mockResolvedValue(existingUser)

    const req = new NextRequest('http://localhost:3000/api/signup', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe('User already exists')
    expect(Prisma.user.create).not.toHaveBeenCalled()
    expect(bcrypt.hash).not.toHaveBeenCalled()
  })

  it('should return error when email already exists', async () => {
    const existingUser = {
      id: 1,
      username: 'otheruser',
      email: 'test@example.com',
    }

    ;(Prisma.user.findFirst as jest.Mock).mockResolvedValue(existingUser)

    const req = new NextRequest('http://localhost:3000/api/signup', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe('User already exists')
    expect(Prisma.user.create).not.toHaveBeenCalled()
  })

  it('should hash password before storing', async () => {
    const mockUser = {
      id: 1,
      name: 'Test User',
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashedPassword',
    }

    ;(Prisma.user.findFirst as jest.Mock).mockResolvedValue(null)
    ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword')
    ;(Prisma.user.create as jest.Mock).mockResolvedValue(mockUser)

    const req = new NextRequest('http://localhost:3000/api/signup', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        password: 'plainPassword123',
      }),
    })

    await POST(req)

    expect(bcrypt.hash).toHaveBeenCalledWith('plainPassword123', 10)
    expect(Prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        password: 'hashedPassword',
      }),
    })
  })

  it('should handle database errors', async () => {
    ;(Prisma.user.findFirst as jest.Mock).mockResolvedValue(null)
    ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword')
    ;(Prisma.user.create as jest.Mock).mockRejectedValue(
      new Error('Database error')
    )

    const req = new NextRequest('http://localhost:3000/api/signup', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      }),
    })

    const response = await POST(req)

    // The current implementation doesn't return error response, just logs
    // This test verifies it doesn't crash
    expect(response).toBeDefined()
  })
})

