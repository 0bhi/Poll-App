import React from "react";

interface CommentProps {
  comment: string;
  index: number;
}

const Comment: React.FC<CommentProps> = ({ comment, index }) => {
  return <div>comment</div>;
};

export default Comment;
