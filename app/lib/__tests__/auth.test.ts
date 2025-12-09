import bcrypt from 'bcrypt'
import crypto from 'crypto'

// Mock Prisma BEFORE importing auth.ts to prevent PrismaClient initialization
jest.mock('../db', () => ({
  __esModule: true,
  default: {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  },
}))

jest.mock('bcrypt')
jest.mock('crypto')

// Import auth AFTER mocking Prisma
import { NEXT_AUTH_CONFIG } from '../auth'
import Prisma from '../db'

describe('NEXT_AUTH_CONFIG', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Credentials Provider', () => {
    const getCredentialsProvider = () => {
      const provider = NEXT_AUTH_CONFIG.providers.find(
        (p: any) => p.id === 'credentials'
      )
      if (!provider) {
        throw new Error('Credentials provider not found')
      }
      return provider
    }

    it('should authenticate user with valid credentials', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
        name: 'Test User',
        username: 'testuser',
      }

      ;(Prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

      const provider = getCredentialsProvider()
      if (!provider) {
        throw new Error('Provider not found')
      }
      
      // NextAuth wraps the authorize function in provider.options.authorize
      const authorizeFn = (provider as any).options?.authorize
      
      if (!authorizeFn) {
        throw new Error(`Authorize function not found in provider.options`)
      }
      
      if (typeof authorizeFn !== 'function') {
        throw new Error(`Authorize is not a function, it's: ${typeof authorizeFn}`)
      }
      
      const result = await authorizeFn({
        email: 'test@example.com',
        password: 'password123',
      })

      expect(result).toEqual({
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        username: 'testuser',
      })
      expect(Prisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          email: 'test@example.com',
        },
      })
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword')
    })

    it('should throw error for invalid email', async () => {
      ;(Prisma.user.findFirst as jest.Mock).mockResolvedValue(null)

      const provider = getCredentialsProvider()
      const authorizeFn = (provider as any).options?.authorize

      await expect(
        authorizeFn({
          email: 'invalid@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('No user found with the given email')
    })

    it('should throw error for invalid password', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
      }

      ;(Prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      const provider = getCredentialsProvider()
      const authorizeFn = (provider as any).options?.authorize

      await expect(
        authorizeFn({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow('Invalid password')
    })

    it('should throw error when credentials are missing', async () => {
      const provider = getCredentialsProvider()
      const authorizeFn = (provider as any).options?.authorize

      await expect(authorizeFn(null)).rejects.toThrow('Missing credentials')
    })
  })

  describe('JWT Callback', () => {
    it('should add user data to token', async () => {
      const user = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        username: 'testuser',
        profilePicture: 'pic.jpg',
      }

      const result = await NEXT_AUTH_CONFIG.callbacks.jwt({
        token: {},
        user,
      } as any)

      expect(result.id).toBe('1')
      expect(result.name).toBe('Test User')
      expect(result.email).toBe('test@example.com')
      expect(result.username).toBe('testuser')
      expect(result.picture).toBe('pic.jpg')
    })

    it('should handle Google OAuth profile', async () => {
      const profile = {
        email: 'google@example.com',
        name: 'Google User',
        picture: 'google-pic.jpg',
      }

      const account = {
        provider: 'google',
      }

      const dbUser = {
        id: 1,
        username: 'googleuser',
      }

      ;(Prisma.user.findUnique as jest.Mock).mockResolvedValue(dbUser)

      const result = await NEXT_AUTH_CONFIG.callbacks.jwt({
        token: {},
        account,
        profile,
      } as any)

      expect(result.id).toBe(1)
      expect(result.picture).toBe('google-pic.jpg')
      expect(result.username).toBe('googleuser')
    })
  })

  describe('Session Callback', () => {
    it('should add user data to session', async () => {
      const token = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        username: 'testuser',
        picture: 'pic.jpg',
      }

      const session = {
        user: {},
      }

      const result = await NEXT_AUTH_CONFIG.callbacks.session({
        session,
        token,
      } as any)

      expect(result.user.id).toBe('1')
      expect(result.user.name).toBe('Test User')
      expect(result.user.email).toBe('test@example.com')
      expect(result.user.username).toBe('testuser')
      expect(result.user.image).toBe('pic.jpg')
    })
  })

  describe('SignIn Callback', () => {
    it('should create user for Google OAuth', async () => {
      const profile = {
        email: 'newuser@example.com',
        name: 'New User',
        picture: 'new-pic.jpg',
      }

      const account = {
        provider: 'google',
      }

      ;(Prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(null) // Username check
        .mockResolvedValueOnce(null) // Email check

      ;(crypto.randomBytes as jest.Mock).mockReturnValue({
        toString: jest.fn(() => 'randomPassword'),
      })

      ;(Prisma.user.upsert as jest.Mock).mockResolvedValue({
        id: 1,
        email: 'newuser@example.com',
        name: 'New User',
        username: 'newuser',
      })

      const result = await NEXT_AUTH_CONFIG.callbacks.signIn({
        account,
        profile,
      } as any)

      expect(result).toBe(true)
      expect(Prisma.user.upsert).toHaveBeenCalledWith({
        where: {
          email: 'newuser@example.com',
        },
        update: {},
        create: {
          email: 'newuser@example.com',
          name: 'New User',
          username: 'newuser',
          profilePicture: 'new-pic.jpg',
          password: 'randomPassword',
        },
      })
    })

    it('should handle username conflicts for Google OAuth', async () => {
      const profile = {
        email: 'user@example.com',
        name: 'User',
        picture: 'pic.jpg',
      }

      const account = {
        provider: 'google',
      }

      // Mock findUnique to return user for 'user', then null for 'user1'
      const findUniqueMock = jest.fn()
        .mockResolvedValueOnce({ id: 1, username: 'user' }) // First check: 'user' exists
        .mockResolvedValueOnce(null) // Second check: 'user1' doesn't exist
      
      ;(Prisma.user.findUnique as jest.Mock) = findUniqueMock

      ;(crypto.randomBytes as jest.Mock).mockReturnValue({
        toString: jest.fn(() => 'randomPassword'),
      })

      ;(Prisma.user.upsert as jest.Mock).mockResolvedValue({
        id: 2,
        email: 'user@example.com',
        username: 'user1',
      })

      const result = await NEXT_AUTH_CONFIG.callbacks.signIn({
        account,
        profile,
      } as any)

      expect(result).toBe(true)
      expect(Prisma.user.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            username: 'user1',
          }),
        })
      )
    })

    it('should return true for non-Google providers', async () => {
      const account = {
        provider: 'credentials',
      }

      const result = await NEXT_AUTH_CONFIG.callbacks.signIn({
        account,
      } as any)

      expect(result).toBe(true)
      expect(Prisma.user.upsert).not.toHaveBeenCalled()
    })

    it('should handle errors during Google sign-in', async () => {
      const profile = {
        email: 'error@example.com',
        name: 'Error User',
        picture: 'pic.jpg',
      }

      const account = {
        provider: 'google',
      }

      // Mock findUnique to throw error on first call (username check)
      ;(Prisma.user.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      const result = await NEXT_AUTH_CONFIG.callbacks.signIn({
        account,
        profile,
      } as any)

      expect(result).toBe(false)
      expect(Prisma.user.upsert).not.toHaveBeenCalled()
    })
  })
})

