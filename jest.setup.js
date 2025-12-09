// Minimal setup - only mock what's actually needed
// For API routes (Node environment): No Next.js mocking needed - server APIs work natively!
// For components (jsdom): Mock Next.js client-side APIs

// Mock Next.js router hooks (needed for components using useRouter, etc.)
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    }
  },
  usePathname() {
    return '/'
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

// Mock next-auth (needed for components using authentication)
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated',
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  SessionProvider: ({ children }) => children,
}))

// Mock axios (used in both API routes and components)
jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
  },
}))

// Mock Next.js Image component (standard practice for component tests)
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />
  },
}))

// Only import jest-dom if we're in a browser-like environment (components)
if (typeof window !== 'undefined') {
  require('@testing-library/jest-dom')
}

