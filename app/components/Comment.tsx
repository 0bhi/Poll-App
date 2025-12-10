import axios from "axios";
import Image from "next/image";
import React, { useEffect, useState } from "react";

interface CommentProps {
  comment: string;
  index: number;
  userid: number;
  replies?: any[];
  onReply?: (replyText: string, parentId: number) => void;
  commentId?: number;
}

const NEST_COLORS = [
  "border-blue-300 dark:border-blue-600",
  "border-purple-300 dark:border-purple-600",
  "border-indigo-300 dark:border-indigo-600",
  "border-pink-300 dark:border-pink-600",
];

function getNestClass(level: number) {
  return NEST_COLORS[level % NEST_COLORS.length];
}

const Comment: React.FC<CommentProps & { level?: number }> = ({
  comment,
  userid,
  index,
  replies = [],
  onReply,
  commentId,
  level = 0,
}) => {
  const [profilePic, setProfilePic] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState("");

  const fetchData = async () => {
    // Only fetch if userid is valid
    if (!userid) {
      console.warn("userid is missing, skipping user fetch");
      return;
    }

    try {
      const res = await axios.get("/api/users/user", {
        params: { user_id: String(userid) },
      });
      if (res?.data?.data) {
        setProfilePic(res.data.data.profilePicture || "");
        setName(res.data.data.name || "");
        setUsername(res.data.data.username || "");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userid]);

  const handleReply = () => {
    if (onReply && commentId) {
      onReply(replyText, commentId);
    }
    // Always clear the reply box after submission
    setReplyText("");
    setShowReplyBox(false);
  };

  return (
    <div className="ml-0 mb-4">
      <div
        className={`flex gap-3 items-start transition-all duration-300 animate-fade-in rounded-lg p-3 px-4 bg-gray-50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700 hover:shadow-md`}
      >
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-gray-200 dark:ring-gray-700 transition-all duration-300">
            <Image
              className="object-cover w-full h-full"
              src={profilePic || "https://api.dicebear.com/7.x/identicon/svg"}
              alt={`${name}'s profile`}
              width={40}
              height={40}
            />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
              {name || "Anonymous"}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              @{username || "user"}
            </span>
          </div>
          <div className="text-sm text-gray-900 dark:text-gray-100 mb-2 leading-relaxed">
            {comment}
          </div>
          <button
            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors"
            onClick={() => setShowReplyBox((v) => !v)}
          >
            Reply
          </button>
          {showReplyBox && (
            <div className="mt-3 space-y-2">
              <textarea
                className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
                rows={2}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
              />
              <div className="flex justify-end gap-2">
                <button
                  className="px-3 py-1.5 text-xs rounded-lg font-medium transition-all duration-200 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  onClick={() => {
                    setShowReplyBox(false);
                    setReplyText("");
                  }}
                >
                  Cancel
                </button>
                <button
                  className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all duration-200 ${
                    replyText.trim()
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg active:scale-95"
                      : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  }`}
                  onClick={handleReply}
                  disabled={!replyText.trim()}
                >
                  Reply
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Render replies indented */}
      {replies && replies.length > 0 && (
        <div
          className={`relative ml-6 md:ml-8 mt-4 pl-4 pr-2 border-l-2 ${getNestClass(
            level + 1
          )} animate-fade-in`}
        >
          {replies.map((reply, idx) => (
            <div key={reply.id || idx} className="mb-4 last:mb-0">
              <Comment
                comment={reply.text}
                userid={reply.user_id}
                index={idx}
                replies={reply.replies || []}
                onReply={onReply}
                commentId={reply.id}
                level={level + 1}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Comment;
