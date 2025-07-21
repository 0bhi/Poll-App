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

const Comment: React.FC<CommentProps> = ({
  comment,
  userid,
  index,
  replies = [],
  onReply,
  commentId,
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
      <div className="flex gap-4 m-2 p-2 rounded shadow-lg">
        <div className="w-12 h-12 rounded-full overflow-hidden">
          <Image
            className="object-cover scale-125"
            src={profilePic}
            alt={profilePic}
            width={64}
            height={64}
          />
        </div>
        <div>
          <div className="flex gap-2">
            <div>{name}</div>
            <div className="text-gray-400">{"@" + username}</div>
          </div>
          <div className="w-full py-2">{comment}</div>
          <button
            className="text-blue-500 text-xs"
            onClick={() => setShowReplyBox((v) => !v)}
          >
            Reply
          </button>
          {showReplyBox && (
            <div className="mt-2">
              <textarea
                className="border rounded w-full p-1"
                rows={1}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
              />
              <button
                className="bg-blue-500 text-white px-2 py-1 rounded mt-1 text-xs"
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
        <div className="ml-10">
          {replies.map((reply, idx) => (
            <Comment
              key={reply.id || idx}
              comment={reply.text}
              userid={reply.user_id}
              index={idx}
              replies={reply.replies}
              onReply={onReply}
              commentId={reply.id}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Comment;
