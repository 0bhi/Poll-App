import React from "react";
import {
  FaRegComment,
  FaRegBookmark,
  FaShareAlt,
} from "react-icons/fa";
import {
  BiDownvote,
  BiSolidDownvote,
  BiSolidUpvote,
  BiUpvote,
} from "react-icons/bi";
import { useRouter } from "next/navigation";

interface PostActionsProps {
  postId: string;
  upvoted: boolean;
  downvoted: boolean;
  onUpvote: () => void;
  onDownvote: () => void;
  onShare: (event: React.MouseEvent) => void;
}

export default function PostActions({
  postId,
  upvoted,
  downvoted,
  onUpvote,
  onDownvote,
  onShare,
}: PostActionsProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30">
      <div className="flex items-center gap-1">
        <button
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onUpvote();
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95 ${
            upvoted
              ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
              : "text-gray-600 dark:text-gray-400"
          }`}
          aria-label="Upvote"
        >
          {upvoted ? (
            <BiSolidUpvote
              size={20}
              className="text-blue-600 dark:text-blue-400"
            />
          ) : (
            <BiUpvote size={20} />
          )}
          <span className="text-xs font-medium hidden sm:inline">Upvote</span>
        </button>
        <button
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onDownvote();
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95 ${
            downvoted
              ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20"
              : "text-gray-600 dark:text-gray-400"
          }`}
          aria-label="Downvote"
        >
          {downvoted ? (
            <BiSolidDownvote
              size={20}
              className="text-red-600 dark:text-red-400"
            />
          ) : (
            <BiDownvote size={20} />
          )}
          <span className="text-xs font-medium hidden sm:inline">Downvote</span>
        </button>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={(event) => {
            event.stopPropagation();
            router.push(`/post/${postId}`);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95"
          aria-label="Comment"
        >
          <FaRegComment size={16} />
          <span className="text-xs font-medium hidden sm:inline">Comment</span>
        </button>
        <button
          onClick={(event) => {
            event.stopPropagation();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95"
          aria-label="Bookmark"
        >
          <FaRegBookmark size={16} />
          <span className="text-xs font-medium hidden sm:inline">Bookmark</span>
        </button>
        <button
          onClick={onShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95"
          aria-label="Share"
        >
          <FaShareAlt size={16} />
          <span className="text-xs font-medium hidden sm:inline">Share</span>
        </button>
      </div>
    </div>
  );
}
