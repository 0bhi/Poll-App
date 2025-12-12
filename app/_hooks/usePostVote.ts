import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { signIn } from "next-auth/react";
import { apiClient } from "../_lib/apiClient";
import { logger } from "../_lib/logger";

interface UsePostVoteOptions {
  postId: string;
  onError?: (error: Error) => void;
}

export function usePostVote({ postId, onError }: UsePostVoteOptions) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [upvoted, setUpvoted] = useState(false);
  const [downvoted, setDownvoted] = useState(false);
  const [loading, setLoading] = useState(false);

  const requireAuth = useCallback(() => {
    if (status === "unauthenticated") {
      signIn(undefined, { callbackUrl: pathname });
      return false;
    }
    return true;
  }, [status, pathname]);

  const handleUpvote = useCallback(async () => {
    if (!requireAuth() || !session?.user?.id) return;

    setLoading(true);
    try {
      if (downvoted) {
        setDownvoted(false);
        setUpvoted(true);
        await apiClient.post("/api/postVote", {
          user_id: session.user.id,
          post_id: postId,
          type: "UPVOTE",
        });
        return;
      }

      if (!upvoted) {
        setUpvoted(true);
        await apiClient.post("/api/postVote", {
          user_id: session.user.id,
          post_id: postId,
          type: "UPVOTE",
        });
      } else {
        setUpvoted(false);
        await apiClient.post("/api/postVote", {
          user_id: session.user.id,
          post_id: postId,
          type: "REMOVE",
        });
      }
    } catch (error) {
      logger.error("Error upvoting post", error);
      if (onError) {
        onError(error instanceof Error ? error : new Error("Failed to upvote"));
      }
    } finally {
      setLoading(false);
    }
  }, [postId, session, upvoted, downvoted, requireAuth, onError]);

  const handleDownvote = useCallback(async () => {
    if (!requireAuth() || !session?.user?.id) return;

    setLoading(true);
    try {
      if (upvoted) {
        setUpvoted(false);
        setDownvoted(true);
        await apiClient.post("/api/postVote", {
          user_id: session.user.id,
          post_id: postId,
          type: "DOWNVOTE",
        });
        return;
      }

      if (!downvoted) {
        setDownvoted(true);
        await apiClient.post("/api/postVote", {
          user_id: session.user.id,
          post_id: postId,
          type: "DOWNVOTE",
        });
      } else {
        setDownvoted(false);
        await apiClient.post("/api/postVote", {
          user_id: session.user.id,
          post_id: postId,
          type: "REMOVE",
        });
      }
    } catch (error) {
      logger.error("Error downvoting post", error);
      if (onError) {
        onError(error instanceof Error ? error : new Error("Failed to downvote"));
      }
    } finally {
      setLoading(false);
    }
  }, [postId, session, upvoted, downvoted, requireAuth, onError]);

  const initializeVoteState = useCallback(
    async (userId: string) => {
      try {
        const postVoteRes = await apiClient.get<{ type: string }>("/api/postVote", {
          params: { post_id: postId, user_id: userId },
        });
        const voteType = postVoteRes.data?.type;
        if (voteType === "UPVOTE") {
          setUpvoted(true);
          setDownvoted(false);
        } else if (voteType === "DOWNVOTE") {
          setUpvoted(false);
          setDownvoted(true);
        } else {
          setUpvoted(false);
          setDownvoted(false);
        }
      } catch (error) {
        setUpvoted(false);
        setDownvoted(false);
        if (apiClient.isApiError(error) && error.statusCode !== 404) {
          logger.error("Error fetching post vote", error);
        }
      }
    },
    [postId]
  );

  return {
    upvoted,
    downvoted,
    loading,
    handleUpvote,
    handleDownvote,
    initializeVoteState,
  };
}

