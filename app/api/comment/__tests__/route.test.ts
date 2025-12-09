import { POST } from "../route";
import { NextRequest } from "next/server";
import Prisma from "../../../lib/db";

jest.mock("../../../lib/db", () => ({
  __esModule: true,
  default: {
    comment: {
      create: jest.fn(),
    },
  },
}));

describe("POST /api/comment", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create a top-level comment", async () => {
    const mockComment = {
      id: 1,
      text: "This is a comment",
      postId: 1,
      user_id: 1,
      parentId: null,
    };

    (Prisma.comment.create as jest.Mock).mockResolvedValue(mockComment);

    const req = new NextRequest("http://localhost:3000/api/comment", {
      method: "POST",
      body: JSON.stringify({
        comment: "This is a comment",
        postid: 1,
        userid: 1,
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockComment);
    expect(Prisma.comment.create).toHaveBeenCalledWith({
      data: {
        text: "This is a comment",
        postId: 1,
        user_id: 1,
        parentId: undefined,
      },
    });
  });

  it("should create a nested reply with parentId", async () => {
    const mockReply = {
      id: 2,
      text: "This is a reply",
      postId: 1,
      user_id: 2,
      parentId: 1,
    };

    (Prisma.comment.create as jest.Mock).mockResolvedValue(mockReply);

    const req = new NextRequest("http://localhost:3000/api/comment", {
      method: "POST",
      body: JSON.stringify({
        comment: "This is a reply",
        postid: 1,
        userid: 2,
        parentId: 1,
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockReply);
    expect(Prisma.comment.create).toHaveBeenCalledWith({
      data: {
        text: "This is a reply",
        postId: 1,
        user_id: 2,
        parentId: 1,
      },
    });
  });

  it("should handle database errors", async () => {
    (Prisma.comment.create as jest.Mock).mockRejectedValue(
      new Error("Database error")
    );

    const req = new NextRequest("http://localhost:3000/api/comment", {
      method: "POST",
      body: JSON.stringify({
        comment: "This is a comment",
        postid: 1,
        userid: 1,
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to create comment");
  });

  it("should parse postid and userid as integers", async () => {
    const mockComment = {
      id: 1,
      text: "This is a comment",
      postId: 1,
      user_id: 1,
      parentId: null,
    };

    (Prisma.comment.create as jest.Mock).mockResolvedValue(mockComment);

    const req = new NextRequest("http://localhost:3000/api/comment", {
      method: "POST",
      body: JSON.stringify({
        comment: "This is a comment",
        postid: "1", // String instead of number
        userid: "1", // String instead of number
      }),
    });

    await POST(req);

    expect(Prisma.comment.create).toHaveBeenCalledWith({
      data: {
        text: "This is a comment",
        postId: 1, // Should be parsed as integer
        user_id: 1, // Should be parsed as integer
        parentId: undefined,
      },
    });
  });
});
