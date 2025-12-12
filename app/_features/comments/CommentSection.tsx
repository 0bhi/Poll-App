import React from "react";
import Comment from "./Comment";
import CommentInput from "./CommentInput";

interface Comment {
  id: number;
  text: string;
  user_id: number;
  replies?: Comment[];
  createdAt?: string;
}

interface CommentSectionProps {
  comments: Comment[];
  onCommentSubmit: (comment: string) => void;
  onReplySubmit: (replyText: string, parentId: number) => void;
}

export default function CommentSection({
  comments,
  onCommentSubmit,
  onReplySubmit,
}: CommentSectionProps) {
  return (
    <div className="group transition-all duration-300 ease-in-out rounded-xl shadow-sm bg-card text-main hover:shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-4 md:px-6 pt-4 pb-4">
        <h2 className="heading-2 mb-4 text-gray-900 dark:text-gray-100">
          Comments
        </h2>

        <CommentInput onSubmit={onCommentSubmit} />
      </div>

      <div className="space-y-4 mt-4 mb-6 mx-2">
        {comments && comments.length > 0 ? (
          comments.map((comment, index) => (
            <Comment
              comment={comment.text}
              userid={comment.user_id}
              index={index}
              key={comment.id || index}
              replies={comment.replies || []}
              onReply={onReplySubmit}
              commentId={comment.id}
            />
          ))
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8 text-sm">
            No comments yet. Be the first to comment!
          </div>
        )}
      </div>
    </div>
  );
}
