import React from "react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";

interface PostHeaderProps {
  name: string;
  username: string;
  profilePicUrl: string;
  createdAt: string | null;
}

export default function PostHeader({
  name,
  username,
  profilePicUrl,
  createdAt,
}: PostHeaderProps) {
  const router = useRouter();

  const handleUserClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (username) {
      router.push(`/${username}`);
    }
  };

  return (
    <div className="flex items-center gap-3 px-4 pt-4 pb-3">
      <div className="relative flex-shrink-0">
        <button
          className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-gray-200 dark:ring-gray-700 transition-all duration-300 group-hover:ring-blue-400 dark:group-hover:ring-blue-500"
          onClick={handleUserClick}
        >
          <Image
            src={profilePicUrl}
            alt={`${name}'s profile`}
            className="object-cover w-full h-full"
            width={40}
            height={40}
          />
        </button>
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <button
            className="font-semibold text-left text-sm md:text-base text-gray-900 dark:text-gray-100 truncate hover:underline"
            onClick={handleUserClick}
          >
            {name || "Anonymous"}
          </button>
          {createdAt && (
            <>
              <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                ·
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
              </span>
            </>
          )}
        </div>
        <button
          className="text-xs text-gray-500 dark:text-gray-400 truncate text-left hover:underline"
          onClick={handleUserClick}
        >
          @{username || "user"}
        </button>
      </div>
    </div>
  );
}
