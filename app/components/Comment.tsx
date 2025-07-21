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
  "border-accent bg-gray-50 dark:bg-gray-900/30",
  "border-blue-400 bg-blue-50 dark:bg-blue-900/20",
  "border-green-400 bg-green-50 dark:bg-green-900/20",
  "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20",
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
    const res = await axios.get("/api/users/user", {
      params: { user_id: userid },
    });
    if (res) {
      setProfilePic(res.data.profilePicture);
      setName(res.data.name);
      setUsername(res.data.username);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userid]);

  const handleReply = () => {
    if (onReply && commentId) {
      onReply(replyText, commentId);
      setReplyText("");
      setShowReplyBox(false);
    }
  };

  return (
    <div className="ml-0">
      <div
        className={`card flex gap-2 items-start transition-all duration-300 animate-fade-in rounded-md shadow-sm p-2 bg-card text-main`}
      >
        <div className="avatar overflow-hidden bg-accent/20">
          <Image
            className="object-cover"
            src={profilePic}
            alt={profilePic}
            width={36}
            height={36}
          />
        </div>
        <div className="flex-1">
          <div className="flex gap-1 items-center mb-0.5">
            <div className="heading-3 text-sm">{name}</div>
            <div className="text-gray-400 body-sm text-xs">
              {"@" + username}
            </div>
          </div>
          <div className="w-full py-1 body-lg text-sm">{comment}</div>
          <button
            className="accent text-xs font-medium hover:underline hover:scale-105 transition-all"
            onClick={() => setShowReplyBox((v) => !v)}
          >
            Reply
          </button>
          {showReplyBox && (
            <div className="mt-1">
              <textarea
                className="input w-full body-sm mb-1 bg-card text-main placeholder:text-gray-500"
                rows={1}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
              />
              <button
                className="button text-xs py-compact px-compact"
                onClick={handleReply}
              >
                Reply
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Render replies indented */}
      {replies && replies.length > 0 && (
        <div
          className={`relative ml-6 mt-2 pl-4 border-l-4 ${getNestClass(
            level + 1
          )} animate-fade-in`}
          style={{ marginLeft: `${Math.min(level + 1, 4) * 16}px` }}
        >
          {/* Reply indicator arrow */}
          <div className="absolute -left-3 top-4 w-3 h-3 bg-accent rotate-45 rounded-sm shadow-sm" />
          {replies.map((reply, idx) => (
            <Comment
              key={reply.id || idx}
              comment={reply.text}
              userid={reply.user_id}
              index={idx}
              replies={reply.replies}
              onReply={onReply}
              commentId={reply.id}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Comment;
