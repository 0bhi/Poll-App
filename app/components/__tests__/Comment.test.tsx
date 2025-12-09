/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import Comment from '../Comment'
import axios from 'axios'

jest.mock('axios')
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />
  },
}))

const mockAxios = axios as jest.Mocked<typeof axios>

describe('Comment Component', () => {
  const mockOnReply = jest.fn()

  const mockComment = {
    comment: 'This is a test comment',
    userid: 1,
    index: 0,
    commentId: 1,
    replies: [],
    onReply: mockOnReply,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockAxios.get.mockResolvedValue({
      data: {
        name: 'Test User',
        username: 'testuser',
        profilePicture: 'https://example.com/avatar.jpg',
      },
    })
  })

  it('should render comment text and user info', async () => {
    render(<Comment {...mockComment} />)

    await waitFor(() => {
      expect(screen.getByText('This is a test comment')).toBeInTheDocument()
      expect(screen.getByText('Test User')).toBeInTheDocument()
      expect(screen.getByText('@testuser')).toBeInTheDocument()
    })
  })

  it('should display nested replies', async () => {
    const commentWithReplies = {
      ...mockComment,
      replies: [
        {
          id: 2,
          text: 'This is a reply',
          user_id: 2,
          replies: [],
        },
      ],
    }

    mockAxios.get
      .mockResolvedValueOnce({
        data: {
          name: 'Test User',
          username: 'testuser',
          profilePicture: 'https://example.com/avatar.jpg',
        },
      })
      .mockResolvedValueOnce({
        data: {
          name: 'Reply User',
          username: 'replyuser',
          profilePicture: 'https://example.com/reply.jpg',
        },
      })

    render(<Comment {...commentWithReplies} />)

    await waitFor(() => {
      expect(screen.getByText('This is a reply')).toBeInTheDocument()
    })
  })

  it('should toggle reply box when Reply button is clicked', async () => {
    render(<Comment {...mockComment} />)

    await waitFor(() => {
      const replyButton = screen.getByText('Reply')
      fireEvent.click(replyButton)
    })

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Write a reply...')).toBeInTheDocument()
    })
  })

  it('should submit reply when Reply button in reply box is clicked', async () => {
    render(<Comment {...mockComment} />)

    await waitFor(() => {
      const replyButton = screen.getByText('Reply')
      fireEvent.click(replyButton)
    })

    const textarea = screen.getByPlaceholderText('Write a reply...')
    fireEvent.change(textarea, { target: { value: 'This is my reply' } })

    const submitButton = screen.getAllByText('Reply')[1] // Second Reply button is the submit
    fireEvent.click(submitButton)

    expect(mockOnReply).toHaveBeenCalledWith('This is my reply', 1)
  })

  it('should clear reply text after submission', async () => {
    render(<Comment {...mockComment} />)

    await waitFor(() => {
      const replyButton = screen.getByText('Reply')
      fireEvent.click(replyButton)
    })

    const textarea = screen.getByPlaceholderText('Write a reply...')
    fireEvent.change(textarea, { target: { value: 'This is my reply' } })

    const submitButton = screen.getAllByText('Reply')[1]
    fireEvent.click(submitButton)

    // After submission, the reply box is hidden (which means text was cleared)
    await waitFor(() => {
      expect(screen.queryByPlaceholderText('Write a reply...')).not.toBeInTheDocument()
    })
    
    // Reopen the reply box to verify text was cleared
    const replyButtonAgain = screen.getByText('Reply')
    fireEvent.click(replyButtonAgain)
    
    await waitFor(() => {
      const newTextarea = screen.getByPlaceholderText('Write a reply...')
      expect(newTextarea).toHaveValue('')
    })
  })

  it('should hide reply box after submission', async () => {
    render(<Comment {...mockComment} />)

    await waitFor(() => {
      const replyButton = screen.getByText('Reply')
      fireEvent.click(replyButton)
    })

    const textarea = screen.getByPlaceholderText('Write a reply...')
    fireEvent.change(textarea, { target: { value: 'This is my reply' } })

    const submitButton = screen.getAllByText('Reply')[1]
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.queryByPlaceholderText('Write a reply...')).not.toBeInTheDocument()
    })
  })

  it('should render nested replies recursively', async () => {
    const commentWithNestedReplies = {
      ...mockComment,
      replies: [
        {
          id: 2,
          text: 'First level reply',
          user_id: 2,
          replies: [
            {
              id: 3,
              text: 'Second level reply',
              user_id: 3,
              replies: [],
            },
          ],
        },
      ],
    }

    mockAxios.get
      .mockResolvedValueOnce({
        data: {
          name: 'Test User',
          username: 'testuser',
          profilePicture: 'https://example.com/avatar.jpg',
        },
      })
      .mockResolvedValueOnce({
        data: {
          name: 'Reply User 1',
          username: 'replyuser1',
          profilePicture: 'https://example.com/reply1.jpg',
        },
      })
      .mockResolvedValueOnce({
        data: {
          name: 'Reply User 2',
          username: 'replyuser2',
          profilePicture: 'https://example.com/reply2.jpg',
        },
      })

    render(<Comment {...commentWithNestedReplies} />)

    await waitFor(() => {
      expect(screen.getByText('First level reply')).toBeInTheDocument()
      expect(screen.getByText('Second level reply')).toBeInTheDocument()
    })
  })

  it('should use default profile picture when not provided', async () => {
    mockAxios.get.mockResolvedValue({
      data: {
        name: 'Test User',
        username: 'testuser',
        profilePicture: null,
      },
    })

    render(<Comment {...mockComment} />)

    await waitFor(() => {
      const img = screen.getByAltText('')
      expect(img).toBeInTheDocument()
    })
  })

  it('should not call onReply if commentId is not provided', async () => {
    const commentWithoutId = {
      ...mockComment,
      commentId: undefined,
    }

    render(<Comment {...commentWithoutId} />)

    await waitFor(() => {
      const replyButton = screen.getByText('Reply')
      fireEvent.click(replyButton)
    })

    const textarea = screen.getByPlaceholderText('Write a reply...')
    fireEvent.change(textarea, { target: { value: 'This is my reply' } })

    const submitButton = screen.getAllByText('Reply')[1]
    fireEvent.click(submitButton)

    expect(mockOnReply).not.toHaveBeenCalled()
  })
})

