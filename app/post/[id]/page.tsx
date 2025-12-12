"use client";

import React, { useEffect, useState } from "react";
import { apiClient } from "../../_lib/apiClient";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { logger } from "../../_lib/logger";
import PostHeader from "../../_features/posts/PostHeader";
import PollOption from "../../_features/posts/PollOption";
import PostActions from "../../_features/posts/PostActions";
import CommentSection from "../../_features/comments/CommentSection";

interface PostOption {
  id: number;
  text: string;
  votes?: Array<{ id: number }>;
}

interface Comment {
  id: number;
  text: string;
  user_id: number;
  replies?: Comment[];
  createdAt?: string;
}

interface PostType {
  id: string;
  text: string;
  options: PostOption[];
  user_id: string;
  comments: Comment[];
  createdAt?: string;
}

const PostDetailPage = () => {
  const session = useSession();
  const { id } = useParams();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [profilePicUrl, setProfilePicUrl] = useState("");
  const [votes, setVotes] = useState([0, 0, 0, 0]);
  const [isClicked, setIsClicked] = useState(false);
  const [clickedOption, setClickedOption] = useState<number | null>(null);
  const [post, setPost] = useState<PostType>();
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [upvoted, setUpvoted] = useState(false);
  const [downvoted, setDownvoted] = useState(false);

  const fetchData = async () => {
    try {
      const postRes = await apiClient.get<PostType>("/api/post", {
        params: { postid: id },
      });

      const postData = postRes.data;
      if (postData) {
        setPost(postData);

        const votesArray = postData.options.map(
          (option: PostOption) => (option.votes || []).length
        );
        setVotes(votesArray);

        if (postData.createdAt) {
          setCreatedAt(postData.createdAt);
        }

        if (postData.user_id) {
          const userRes = await apiClient.get<{
            name: string;
            username: string;
            profilePicture?: string;
          }>("/api/users/user", {
            params: { user_id: String(postData.user_id) },
          });

          setName(userRes.data?.name || "");
          setUsername(userRes.data?.username || "");
          if (userRes.data?.profilePicture) {
            setProfilePicUrl(userRes.data.profilePicture);
          } else {
            const defaultProfilePic =
              "https://api.dicebear.com/7.x/identicon/svg";
            setProfilePicUrl(defaultProfilePic);
          }
        }
      }
    } catch (error) {
      logger.error("Error fetching post", error);
    }
  };

  const fetchVotes = async () => {
    if (session.status === "authenticated" && session.data?.user?.id && id) {
      try {
        const voteRes = await apiClient.get<{
          option_id: number;
        } | null>("/api/votes/vote", {
          params: { postId: String(id), userId: session.data.user.id },
        });

        if (voteRes.data) {
          setClickedOption(voteRes.data.option_id);
          setIsClicked(true);
        }

        const postVoteRes = await apiClient.get<{
          type: string;
        }>("/api/postVote", {
          params: { post_id: String(id), user_id: session.data.user.id },
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
      } catch (error: unknown) {
        setUpvoted(false);
        setDownvoted(false);
        if (apiClient.isApiError(error) && error.statusCode !== 404) {
          logger.error("Vote fetch error", error);
        }
      }
    } else {
      setUpvoted(false);
      setDownvoted(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    if (session.status === "authenticated" && id) {
      fetchVotes();
    } else if (session.status === "unauthenticated") {
      setUpvoted(false);
      setDownvoted(false);
      setIsClicked(false);
      setClickedOption(null);
    }
  }, [session.status, session.data?.user?.id, id]);

  const onChoice = async (choice: PostOption, index: number) => {
    if (isClicked) return;
    updateVote(index, 1);
    setIsClicked(true);
    setClickedOption(choice.id);
    try {
      await apiClient.post("/api/votes/vote", {
        name: session.data?.user?.name,
        user_id: session.data?.user?.id,
        option_id: choice.id,
        post_id: id,
        postAuthorId: post?.user_id,
      });
    } catch (error) {
      logger.error("Error voting on poll", error);
      updateVote(index, -1);
      setIsClicked(false);
      setClickedOption(null);
    }
  };

  const updateVote = (index: number, increment: number) => {
    const updatedVotes = [...votes];
    updatedVotes[index] += increment;
    setVotes(updatedVotes);
  };

  const handleUpvote = async () => {
    if (session.status === "unauthenticated" || !session.data?.user?.id || !id) {
      return;
    }

    try {
      if (downvoted) {
        setDownvoted(false);
        setUpvoted(true);
        await apiClient.post("/api/postVote", {
          user_id: session.data.user.id,
          post_id: String(id),
          type: "UPVOTE",
        });
        return;
      }
      if (!upvoted) {
        setUpvoted(true);
        await apiClient.post("/api/postVote", {
          user_id: session.data.user.id,
          post_id: String(id),
          type: "UPVOTE",
        });
      } else {
        setUpvoted(false);
        await apiClient.post("/api/postVote", {
          user_id: session.data.user.id,
          post_id: String(id),
          type: "REMOVE",
        });
      }
    } catch (error: unknown) {
      logger.error("Error upvoting", error);
      if (downvoted) {
        setDownvoted(true);
        setUpvoted(false);
      } else {
        setUpvoted(!upvoted);
      }
    }
  };

  const handleDownvote = async () => {
    if (session.status === "unauthenticated" || !session.data?.user?.id || !id) {
      return;
    }

    try {
      if (upvoted) {
        setUpvoted(false);
        setDownvoted(true);
        await apiClient.post("/api/postVote", {
          user_id: session.data.user.id,
          post_id: String(id),
          type: "DOWNVOTE",
        });
        return;
      }
      if (!downvoted) {
        setDownvoted(true);
        await apiClient.post("/api/postVote", {
          user_id: session.data.user.id,
          post_id: String(id),
          type: "DOWNVOTE",
        });
      } else {
        setDownvoted(false);
        await apiClient.post("/api/postVote", {
          user_id: session.data.user.id,
          post_id: String(id),
          type: "REMOVE",
        });
      }
    } catch (error: unknown) {
      logger.error("Error downvoting", error);
      if (upvoted) {
        setUpvoted(true);
        setDownvoted(false);
      } else {
        setDownvoted(!downvoted);
      }
    }
  };

  const handleShare = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    try {
      const url =
        typeof window !== "undefined"
          ? `${window.location.origin}/post/${id}`
          : `/post/${id}`;
      if (navigator?.share) {
        await navigator.share({ url });
      } else if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      }
    } catch (error) {
      logger.error("Failed to share post", error);
    }
  };

  const handleComment = async (commentText: string) => {
    if (!commentText.trim() || !session.data?.user?.id) {
      return;
    }

    try {
      await apiClient.post("/api/comment", {
        postid: id,
        comment: commentText,
        userid: session.data.user.id,
      });
      // Refetch the post to get the updated comment with all data
      const postRes = await apiClient.get<PostType>("/api/post", {
        params: { postid: id },
      });
      if (postRes.data) {
        setPost(postRes.data);
        const votesArray = postRes.data.options.map(
          (option: PostOption) => (option.votes || []).length
        );
        setVotes(votesArray);
      }
    } catch (error: unknown) {
      logger.error("Error posting comment", error);
    }
  };

  const handleReplyToComment = async (replyText: string, parentId: number) => {
    if (!replyText.trim() || !session.data?.user?.id) {
      return;
    }

    try {
      await apiClient.post("/api/comment", {
        postid: id,
        comment: replyText,
        userid: session.data.user.id,
        parentId: parentId,
      });
      // Refetch the post to get the updated comment structure with nested replies
      const postRes = await apiClient.get<PostType>("/api/post", {
        params: { postid: id },
      });
      if (postRes.data) {
        setPost(postRes.data);
        const votesArray = postRes.data.options.map(
          (option: PostOption) => (option.votes || []).length
        );
        setVotes(votesArray);
      }
    } catch (error: unknown) {
      logger.error("Error posting reply", error);
    }
  };

  // Helper to calculate poll percentages
  function getPercentages() {
    const total = votes.reduce((a, b) => a + b, 0);
    if (total === 0) return post?.options?.map(() => 0) || [];
    return votes.map((v) => Math.round((v / total) * 100));
  }

  if (!post) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-b from-gray-900 to-gray-800 scrollbar-hide">
      <div className="max-w-4xl mx-auto p-4 space-y-6 pb-8">
        {/* Main Post Card */}
        <div className="group transition-all duration-300 ease-in-out rounded-xl shadow-sm bg-card text-main hover:shadow-xl hover:-translate-y-1 w-full border border-gray-200 dark:border-gray-700 overflow-hidden">
          <PostHeader
            name={name}
            username={username}
            profilePicUrl={profilePicUrl}
            createdAt={createdAt}
          />

          {/* Content */}
          <div className="px-4 pb-4">
            <div className="text-base md:text-lg leading-relaxed mb-4 text-gray-900 dark:text-gray-100 font-medium">
              {post.text}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {post.options?.map((option: PostOption, index: number) => {
                const isSelected = option.id == clickedOption;
                const percentage = getPercentages()[index];

                return (
                  <PollOption
                    key={option.id}
                    option={option}
                    index={index}
                    isSelected={isSelected}
                    isClicked={isClicked || session.status === "unauthenticated"}
                    votes={votes[index]}
                    percentage={percentage}
                    onChoice={onChoice}
                  />
                );
              })}
            </div>
          </div>

          <PostActions
            postId={post.id}
            upvoted={upvoted}
            downvoted={downvoted}
            onUpvote={handleUpvote}
            onDownvote={handleDownvote}
            onShare={handleShare}
          />
        </div>

        {/* Comment Section */}
        <CommentSection
          comments={post.comments || []}
          onCommentSubmit={handleComment}
          onReplySubmit={handleReplyToComment}
        />
      </div>
    </div>
  );
};

export default PostDetailPage;