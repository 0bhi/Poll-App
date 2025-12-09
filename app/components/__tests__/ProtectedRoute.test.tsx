/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { useSession, signIn } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import ProtectedRoute from '../ProtectedRoute'

jest.mock('next-auth/react')
jest.mock('next/navigation', () => ({
  __esModule: true,
  usePathname: jest.fn(),
  useRouter: jest.fn(),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}))

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>
const mockSignIn = signIn as jest.MockedFunction<typeof signIn>

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUsePathname.mockReturnValue('/protected-page')
  })

  it('should render children when authenticated', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          name: 'Test User',
          email: 'test@example.com',
        },
      },
      status: 'authenticated',
    } as any)

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
    expect(mockSignIn).not.toHaveBeenCalled()
  })

  it('should redirect to sign-in when unauthenticated', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    } as any)

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(mockSignIn).toHaveBeenCalledWith(undefined, {
      callbackUrl: '/protected-page',
    })
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('should show loading state when status is loading', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
    } as any)

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    expect(mockSignIn).not.toHaveBeenCalled()
  })

  it('should preserve callback URL when redirecting', () => {
    mockUsePathname.mockReturnValue('/dashboard/settings')

    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    } as any)

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(mockSignIn).toHaveBeenCalledWith(undefined, {
      callbackUrl: '/dashboard/settings',
    })
  })

  it('should not redirect multiple times', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    } as any)

    const { rerender } = render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(mockSignIn).toHaveBeenCalledTimes(1)

    // Rerender with same status
    rerender(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    // Should not call signIn again (useEffect dependency)
    expect(mockSignIn).toHaveBeenCalledTimes(1)
  })
})

