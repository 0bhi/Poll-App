/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import Post from "../Post";
import { useSession } from "next-auth/react";
import axios from "axios";
import { useRouter, usePathname } from "next/navigation";

// Mock dependencies
jest.mock("next-auth/react");
jest.mock("axios");
jest.mock("next/navigation", () => ({
  __esModule: true,
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />;
  },
}));
jest.mock("date-fns", () => ({
  formatDistanceToNow: jest.fn(() => "2 hours ago"),
}));

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockAxios = axios as jest.Mocked<typeof axios>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;
const mockSignIn = jest.fn();

describe("Post Component", () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  };

  const mockPostData = {
    id: "1",
    text: "What is your favorite color?",
    options: [
      { id: 1, text: "Red", votes: [] },
      { id: 2, text: "Blue", votes: [] },
    ],
    user_id: "1",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue(mockRouter as any);
    mockUsePathname.mockReturnValue("/");
    mockUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    } as any);

    // Mock axios.get for user data
    mockAxios.get.mockResolvedValue({
      data: {
        name: "Test User",
        username: "testuser",
        profilePicture: "https://example.com/avatar.jpg",
        createdAt: new Date().toISOString(),
      },
    });
  });

  it("should render post text and options", async () => {
    render(<Post data={mockPostData} />);

    await waitFor(() => {
      expect(
        screen.getByText("What is your favorite color?")
      ).toBeInTheDocument();
      expect(screen.getByText("Red")).toBeInTheDocument();
      expect(screen.getByText("Blue")).toBeInTheDocument();
    });
  });

  it("should display user information", async () => {
    render(<Post data={mockPostData} />);

    await waitFor(() => {
      expect(screen.getByText("Test User")).toBeInTheDocument();
      expect(screen.getByText("@testuser")).toBeInTheDocument();
    });
  });

  it("should use default profile picture when not provided", async () => {
    mockAxios.get.mockResolvedValueOnce({
      data: {
        name: "Test User",
        username: "testuser",
        profilePicture: null,
        createdAt: new Date().toISOString(),
      },
    });

    render(<Post data={mockPostData} />);

    await waitFor(() => {
      const img = screen.getByAltText("ProfilePic");
      expect(img).toHaveAttribute(
        "src",
        "https://api.dicebear.com/7.x/identicon/svg"
      );
    });
  });

  it("should redirect to sign in when voting without authentication", async () => {
    const { useSession: originalUseSession } = require("next-auth/react");
    jest
      .spyOn(require("next-auth/react"), "signIn")
      .mockImplementation(mockSignIn);

    mockUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    } as any);

    render(<Post data={mockPostData} />);

    await waitFor(() => {
      const optionButton = screen.getByText("Red").closest("button");
      if (optionButton) {
        fireEvent.click(optionButton);
      }
    });

    expect(mockSignIn).toHaveBeenCalled();
  });

  it("should allow voting when authenticated", async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: "1",
          name: "Test User",
          email: "test@example.com",
        },
      },
      status: "authenticated",
    } as any);

    mockAxios.get
      .mockResolvedValueOnce({
        data: {
          name: "Test User",
          username: "testuser",
          profilePicture: "https://example.com/avatar.jpg",
          createdAt: new Date().toISOString(),
        },
      })
      .mockResolvedValueOnce({
        data: { vote: null },
      })
      .mockResolvedValueOnce({
        data: { type: null },
      });

    mockAxios.post.mockResolvedValue({
      status: 200,
      data: { res: { id: 1 } },
    });

    render(<Post data={mockPostData} />);

    await waitFor(() => {
      const optionButton = screen.getByText("Red").closest("button");
      if (optionButton) {
        fireEvent.click(optionButton);
      }
    });

    await waitFor(() => {
      expect(mockAxios.post).toHaveBeenCalledWith(
        "/api/votes/vote",
        expect.objectContaining({
          post_id: "1",
          option_id: 1,
        })
      );
    });
  });

  it("should handle upvote when authenticated", async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: "1",
          name: "Test User",
        },
      },
      status: "authenticated",
    } as any);

    mockAxios.get
      .mockResolvedValueOnce({
        data: {
          name: "Test User",
          username: "testuser",
          profilePicture: "https://example.com/avatar.jpg",
          createdAt: new Date().toISOString(),
        },
      })
      .mockResolvedValueOnce({
        data: { vote: null },
      })
      .mockResolvedValueOnce({
        data: { type: null },
      });

    mockAxios.post.mockResolvedValue({
      status: 200,
      data: { message: "Upvoted" },
    });

    render(<Post data={mockPostData} />);

    await waitFor(() => {
      const upvoteButton = screen.getByLabelText("Upvote");
      fireEvent.click(upvoteButton);
    });

    await waitFor(() => {
      expect(mockAxios.post).toHaveBeenCalledWith(
        "/api/postVote",
        expect.objectContaining({
          type: "UPVOTE",
        })
      );
    });
  });

  it("should handle downvote when authenticated", async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: "1",
          name: "Test User",
        },
      },
      status: "authenticated",
    } as any);

    mockAxios.get
      .mockResolvedValueOnce({
        data: {
          name: "Test User",
          username: "testuser",
          profilePicture: "https://example.com/avatar.jpg",
          createdAt: new Date().toISOString(),
        },
      })
      .mockResolvedValueOnce({
        data: { vote: null },
      })
      .mockResolvedValueOnce({
        data: { type: null },
      });

    mockAxios.post.mockResolvedValue({
      status: 200,
      data: { message: "Downvoted" },
    });

    render(<Post data={mockPostData} />);

    await waitFor(() => {
      const downvoteButton = screen.getByLabelText("Downvote");
      fireEvent.click(downvoteButton);
    });

    await waitFor(() => {
      expect(mockAxios.post).toHaveBeenCalledWith(
        "/api/postVote",
        expect.objectContaining({
          type: "DOWNVOTE",
        })
      );
    });
  });

  it("should navigate to post detail on click", async () => {
    render(<Post data={mockPostData} />);

    await waitFor(() => {
      const postCard = screen
        .getByText("What is your favorite color?")
        .closest("div");
      if (postCard) {
        fireEvent.click(postCard);
      }
    });

    expect(mockRouter.push).toHaveBeenCalledWith("/post/1");
  });

  it("should not allow voting twice on the same option", async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: "1",
          name: "Test User",
        },
      },
      status: "authenticated",
    } as any);

    mockAxios.get
      .mockResolvedValueOnce({
        data: {
          name: "Test User",
          username: "testuser",
          profilePicture: "https://example.com/avatar.jpg",
          createdAt: new Date().toISOString(),
        },
      })
      .mockResolvedValueOnce({
        data: { vote: { option_id: 1, user_id: 1 } },
      })
      .mockResolvedValueOnce({
        data: { type: null },
      });

    render(<Post data={mockPostData} />);

    await waitFor(() => {
      const optionButton = screen.getByText("Red").closest("button");
      if (optionButton) {
        expect(optionButton).toBeDisabled();
      }
    });
  });

  it("should handle API errors gracefully", async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: "1",
          name: "Test User",
        },
      },
      status: "authenticated",
    } as any);

    mockAxios.get
      .mockResolvedValueOnce({
        data: {
          name: "Test User",
          username: "testuser",
          profilePicture: "https://example.com/avatar.jpg",
          createdAt: new Date().toISOString(),
        },
      })
      .mockResolvedValueOnce({
        data: { vote: null },
      })
      .mockResolvedValueOnce({
        data: { type: null },
      });

    mockAxios.post.mockRejectedValue(new Error("Network error"));

    render(<Post data={mockPostData} />);

    await waitFor(() => {
      const optionButton = screen.getByText("Red").closest("button");
      if (optionButton) {
        fireEvent.click(optionButton);
      }
    });

    // Should not crash, error is logged
    expect(mockAxios.post).toHaveBeenCalled();
  });
});
