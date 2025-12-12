import React, { useEffect, useState } from "react";
import { apiClient } from "../../_lib/apiClient";
import { useSession, signIn } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { logger } from "../../_lib/logger";
import PostHeader from "./PostHeader";
import PollOption from "./PollOption";
import PostActions from "./PostActions";
import { usePostVote, useShare, usePostData } from "../../_hooks";

interface PostOption {
  id: number;
  text: string;
  votes?: Array<{ id: number }>;
}

interface PostType {
  id: string;
  text: string;
  options: PostOption[];
  user_id: string;
}

const Post = ({ data }: { data: PostType }) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { id, text, options = [], user_id } = data;

  // Use custom hooks
  const {
    name,
    username,
    profilePicUrl,
    votes,
    isClicked,
    clickedOption,
    createdAt,
    setIsClicked,
    setClickedOption,
    updateVote,
  } = usePostData({
    postId: id,
    userId: user_id,
    options,
    enabled: !!user_id,
  });

  const { upvoted, downvoted, handleUpvote, handleDownvote, initializeVoteState } =
    usePostVote({
      postId: id,
    });

  const { shareUrl, isSharing } = useShare();

  // Initialize post vote state when session is available
  useEffect(() => {
    if (session?.user?.id) {
      initializeVoteState(session.user.id);
    }
  }, [session?.user?.id, initializeVoteState]);

  const onChoice = async (choice: PostOption, index: number) => {
    if (status === "unauthenticated") {
      signIn(undefined, { callbackUrl: pathname });
      return;
    }
    if (isClicked) return;

    updateVote(index, 1);
    setIsClicked(true);
    setClickedOption(choice.id);

    try {
      await apiClient.post("/api/votes/vote", {
        name: session?.user?.name,
        user_id: session?.user?.id,
        option_id: choice.id,
        post_id: id,
        postAuthorId: user_id,
      });
    } catch (error) {
      updateVote(index, -1);
      setIsClicked(false);
      setClickedOption(null);
      logger.error("Error voting", error);
    }
  };

  const handleShare = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    await shareUrl(`/post/${id}`);
  };

  // Helper to calculate poll percentages
  function getPercentages() {
    const total = votes.reduce((a, b) => a + b, 0);
    if (total === 0) return options.map(() => 0);
    return votes.map((v) => Math.round((v / total) * 100));
  }

  return (
    <div
      className="group transition-all duration-300 ease-in-out cursor-pointer rounded-xl shadow-sm bg-card text-main hover:shadow-xl hover:-translate-y-1 w-full border border-gray-200 dark:border-gray-700 overflow-hidden"
      onClick={() => router.push(`/post/${id}`)}
    >
      <PostHeader
        name={name}
        username={username}
        profilePicUrl={profilePicUrl}
        createdAt={createdAt}
      />

      {/* Content */}
      <div className="px-4 pb-4">
        <div className="text-base md:text-lg leading-relaxed mb-4 text-gray-900 dark:text-gray-100 font-medium">
          {text}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(options || []).map((option: PostOption, index: number) => {
            const isSelected = option.id == clickedOption;
            const percentage = getPercentages()[index];

            return (
              <PollOption
                key={option.id}
                option={option}
                index={index}
                isSelected={isSelected}
                isClicked={isClicked}
                votes={votes[index]}
                percentage={percentage}
                onChoice={onChoice}
              />
            );
          })}
        </div>
      </div>

      <PostActions
        postId={id}
        upvoted={upvoted}
        downvoted={downvoted}
        onUpvote={handleUpvote}
        onDownvote={handleDownvote}
        onShare={handleShare}
      />
    </div>
  );
};

export default Post;
