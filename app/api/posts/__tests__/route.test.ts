import { GET } from "../route";
import { NextRequest } from "next/server";
import Prisma from "../../../lib/db";

jest.mock("../../../lib/db", () => ({
  __esModule: true,
  default: {
    post: {
      findMany: jest.fn(),
    },
  },
}));

describe("GET /api/posts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return posts with default pagination", async () => {
    const mockPosts = [
      { id: 1, text: "Post 1", options: [] },
      { id: 2, text: "Post 2", options: [] },
    ];

    (Prisma.post.findMany as jest.Mock).mockResolvedValue(mockPosts);

    const req = new NextRequest("http://localhost:3000/api/posts");
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.posts).toEqual(mockPosts);
    expect(data.nextCursor).toBeNull();
    expect(Prisma.post.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
      include: {
        options: { include: { votes: true } },
      },
      take: 10,
    });
  });

  it("should handle custom take parameter", async () => {
    const mockPosts = [
      { id: 1, text: "Post 1", options: [] },
      { id: 2, text: "Post 2", options: [] },
    ];

    (Prisma.post.findMany as jest.Mock).mockResolvedValue(mockPosts);

    const req = new NextRequest("http://localhost:3000/api/posts?take=5");
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.posts).toEqual(mockPosts);
    expect(Prisma.post.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
      include: {
        options: { include: { votes: true } },
      },
      take: 5,
    });
  });

  it("should handle cursor-based pagination", async () => {
    const mockPosts = [
      { id: 2, text: "Post 2", options: [] },
      { id: 3, text: "Post 3", options: [] },
    ];

    (Prisma.post.findMany as jest.Mock).mockResolvedValue(mockPosts);

    const req = new NextRequest(
      "http://localhost:3000/api/posts?cursor=1&take=2"
    );
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.posts).toEqual(mockPosts);
    expect(Prisma.post.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
      include: {
        options: { include: { votes: true } },
      },
      take: 2,
      skip: 1,
      cursor: { id: 1 },
    });
  });

  it("should return nextCursor when more posts exist", async () => {
    const mockPosts = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      text: `Post ${i + 1}`,
      options: [],
    }));

    (Prisma.post.findMany as jest.Mock).mockResolvedValue(mockPosts);

    const req = new NextRequest("http://localhost:3000/api/posts?take=10");
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.nextCursor).toBe(10);
  });

  it("should return null nextCursor when fewer posts than take", async () => {
    const mockPosts = [
      { id: 1, text: "Post 1", options: [] },
      { id: 2, text: "Post 2", options: [] },
    ];

    (Prisma.post.findMany as jest.Mock).mockResolvedValue(mockPosts);

    const req = new NextRequest("http://localhost:3000/api/posts?take=10");
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.nextCursor).toBeNull();
  });

  it("should handle empty results", async () => {
    (Prisma.post.findMany as jest.Mock).mockResolvedValue([]);

    const req = new NextRequest("http://localhost:3000/api/posts");
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.posts).toEqual([]);
    expect(data.nextCursor).toBeNull();
  });

  it("should handle database errors", async () => {
    (Prisma.post.findMany as jest.Mock).mockRejectedValue(
      new Error("Database error")
    );

    const req = new NextRequest("http://localhost:3000/api/posts");
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.error).toBe("Invalid request");
  });

  it("should parse take parameter as integer", async () => {
    const mockPosts = [{ id: 1, text: "Post 1", options: [] }];

    (Prisma.post.findMany as jest.Mock).mockResolvedValue(mockPosts);

    const req = new NextRequest("http://localhost:3000/api/posts?take=20");
    await GET(req);

    expect(Prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 20,
      })
    );
  });
});
