import { z } from "zod";

// Helper schemas
const positiveIntString = z
  .string()
  .regex(/^\d+$/, "Must be a positive integer")
  .transform(Number);
const positiveInt = z.number().int().positive();

// Post schemas
export const createPostSchema = z.object({
  text: z
    .string()
    .min(1, "Text is required")
    .max(5000, "Text must be less than 5000 characters"),
  options: z
    .array(
      z
        .string()
        .min(1, "Option cannot be empty")
        .max(200, "Option must be less than 200 characters")
    )
    .min(2, "At least 2 options are required")
    .max(10, "Maximum 10 options allowed"),
  user_id: z.union([positiveIntString, positiveInt]),
});

export const getPostQuerySchema = z.object({
  postid: positiveIntString.optional(),
});

// Signup schema
export const signupSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be less than 30 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    ),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be less than 100 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
});

// Messages schemas
export const getMessagesQuerySchema = z.object({
  conversation_id: positiveIntString,
  limit: z
    .preprocess((val) => {
      if (val === null || val === undefined || val === "") return 50;
      if (typeof val === "string") {
        const parsed = parseInt(val, 10);
        return isNaN(parsed) ? 50 : parsed;
      }
      return val;
    }, z.number().int().positive().max(100))
    .optional()
    .default(50),
  cursor: positiveIntString.optional(),
});

export const createMessageSchema = z.object({
  conversationId: z.union([positiveIntString, positiveInt]),
  senderId: z.union([positiveIntString, positiveInt]),
  content: z
    .string()
    .min(1, "Content is required")
    .max(2000, "Content must be less than 2000 characters"),
  messageType: z
    .enum(["TEXT", "IMAGE", "POLL_LINK", "SYSTEM"])
    .optional()
    .default("TEXT"),
});

export const updateMessageSchema = z.object({
  messageId: z.union([positiveIntString, positiveInt]),
  isRead: z.boolean(),
});

// Conversations schemas
export const getConversationsQuerySchema = z.object({
  user_id: positiveIntString,
});

export const createConversationSchema = z.object({
  participant1Id: z.union([positiveIntString, positiveInt]),
  participant2Id: z.union([positiveIntString, positiveInt]),
});

// Comment schema
export const createCommentSchema = z.object({
  comment: z
    .string()
    .min(1, "Comment is required")
    .max(1000, "Comment must be less than 1000 characters"),
  postid: z.union([positiveIntString, positiveInt]),
  userid: z.union([positiveIntString, positiveInt]),
  parentId: z.union([positiveIntString, positiveInt]).optional(),
});

// PostVote schemas
export const getPostVoteQuerySchema = z.object({
  user_id: positiveIntString,
  post_id: positiveIntString,
});

export const createPostVoteSchema = z.object({
  user_id: z.union([positiveIntString, positiveInt]),
  post_id: z.union([positiveIntString, positiveInt]),
  type: z.enum(["UPVOTE", "DOWNVOTE", "REMOVE"]),
});

// Vote schemas
export const getVoteQuerySchema = z.object({
  userId: positiveIntString,
  postId: positiveIntString,
});

export const createVoteSchema = z.object({
  user_id: z.union([positiveIntString, positiveInt]),
  post_id: z.union([positiveIntString, positiveInt]),
  option_id: z.union([positiveIntString, positiveInt]),
  postAuthorId: z.union([positiveIntString, positiveInt]),
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
});

export const deleteVoteSchema = z.object({
  id: z.union([positiveIntString, positiveInt]),
});

// Posts schema
export const getPostsQuerySchema = z.object({
  take: z
    .preprocess((val) => {
      if (val === null || val === undefined || val === "") return 10;
      if (typeof val === "string") {
        const parsed = parseInt(val, 10);
        return isNaN(parsed) ? 10 : parsed;
      }
      return val;
    }, z.number().int().positive().max(100))
    .optional()
    .default(10),
  cursor: positiveIntString.optional(),
});

// Users schemas
export const getUserQuerySchema = z.object({
  user_id: positiveIntString,
});

export const searchUsersQuerySchema = z.object({
  q: z
    .string()
    .min(1, "Query is required")
    .max(100, "Query must be less than 100 characters"),
  current_user_id: positiveIntString,
});

// Notifications schema
export const getNotificationsQuerySchema = z.object({
  user_id: positiveIntString,
});
