import React, { useRef, useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";

interface CommentInputProps {
  onSubmit: (comment: string) => void;
  placeholder?: string;
}

export default function CommentInput({
  onSubmit,
  placeholder = "Write a comment...",
}: CommentInputProps) {
  const { data: session } = useSession();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [comment, setComment] = useState("");

  const handleInput = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  const handleSubmit = () => {
    if (comment.trim()) {
      onSubmit(comment.trim());
      setComment("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  return (
    <div className="flex gap-3 mb-4">
      <div className="relative flex-shrink-0">
        {session?.data && (
          <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-gray-200 dark:ring-gray-700 transition-all duration-300">
            <Image
              src={
                session.data.user?.image ||
                "https://api.dicebear.com/7.x/identicon/svg"
              }
              alt="Your profile"
              className="object-cover w-full h-full"
              width={40}
              height={40}
            />
          </div>
        )}
      </div>
      <div className="flex-1">
        <textarea
          className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm md:text-base"
          placeholder={placeholder}
          ref={textareaRef}
          onInput={handleInput}
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <div className="flex justify-end mt-3">
          <button
            onClick={handleSubmit}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
              comment.trim()
                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg active:scale-95"
                : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            }`}
            disabled={!comment.trim()}
          >
            Comment
          </button>
        </div>
      </div>
    </div>
  );
}
