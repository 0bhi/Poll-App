"use client";
import { useSession } from "next-auth/react";
import axios from "axios";
import { useEffect, useState } from "react";
import { FaRegComment, FaVoteYea, FaUserPlus, FaArrowUp } from "react-icons/fa";
import Image from "next/image";

interface NotificationType {
  id: string;
  text: string;
  user_id: string;
  createdAt: string; // Use camelCase to match Prisma
  type: string;
  actors?: UserType[]; // Array of users who performed the action
  post_text?: string; // Optional: preview of the post
}

interface UserType {
  id: string;
  name: string;
  username: string;
  profilePicture: string;
}

function getIcon(type: string) {
  switch (type) {
    case "VOTE":
      return <FaVoteYea className="text-blue-500 text-base md:text-lg mr-2" />;
    case "COMMENT":
      return (
        <FaRegComment className="text-green-500 text-base md:text-lg mr-2" />
      );
    case "UPVOTE":
      return (
        <FaArrowUp className="text-orange-500 text-base md:text-lg mr-2" />
      );
    case "FOLLOW":
      return (
        <FaUserPlus className="text-purple-500 text-base md:text-lg mr-2" />
      );
    default:
      return null;
  }
}

function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString();
}

function NotificationItem({ notif }: { notif: NotificationType }) {
  // No need to fetch actors, they are provided by the API
  const actors = notif.actors || [];
  // Compose display text
  let displayText = notif.text;
  if (actors.length > 0) {
    const names = actors.slice(-2).map((a) => a.name);
    const othersCount = actors.length - names.length;
    if (actors.length === 1) {
      displayText = `${names[0]} voted on your post`;
    } else if (actors.length === 2) {
      displayText = `${names[0]} and ${names[1]} voted on your post`;
    } else {
      displayText = `${names.join(
        ", "
      )} and ${othersCount} others voted on your post`;
    }
  }
  return (
    <div className="card flex items-center transition cursor-pointer p-2 md:p-3 mb-1 md:mb-2 rounded-md shadow-sm bg-gray-800 text-white hover:bg-gray-700 border border-gray-700">
      <div className="flex -space-x-1 mr-2">
        {actors.slice(0, 3).map((actor) => (
          <Image
            key={actor.id}
            src={actor.profilePicture}
            alt={actor.name}
            width={24}
            height={24}
            className="avatar border border-white w-6 h-6 md:w-7 md:h-7"
          />
        ))}
        {actors.length === 0 && (
          <div className="avatar bg-gray-200 w-6 h-6 md:w-7 md:h-7" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <span className="heading-3 text-xs md:text-sm block truncate">
          {displayText}
        </span>
        {notif.post_text && (
          <span className="text-gray-300 body-sm text-xs block truncate">
            : "{notif.post_text}"
          </span>
        )}
        <div className="text-xs text-gray-400 body-sm">
          {timeAgo(notif.createdAt)}
        </div>
      </div>
      <div className="ml-2 icon accent flex-shrink-0">
        {getIcon(notif.type)}
      </div>
    </div>
  );
}

// Skeleton loader for notifications
export function NotificationSkeleton() {
  return (
    <div className="card animate-pulse flex items-center p-2 md:p-3 mb-2 gap-3">
      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
      <div className="flex-1 space-y-2">
        <div className="h-3 md:h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-2 md:h-3 w-1/3 bg-gray-100 dark:bg-gray-800 rounded" />
      </div>
      <div className="ml-2 w-5 h-5 md:w-6 md:h-6 rounded-full bg-gray-200 dark:bg-gray-700" />
    </div>
  );
}

export default function Notificationsbar() {
  const session: any = useSession();
  const [notifs, setNotifs] = useState<NotificationType[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchNotifs = async (userId: string) => {
      setLoading(true);
      try {
        const res = await axios.get("/api/notifications", {
          params: { user_id: userId },
        });
        setNotifs(
          Array.isArray(res.data.notifications) ? res.data.notifications : []
        );
      } catch (error) {
        setNotifs([]);
        setLoading(false);
      }
      setLoading(false);
    };
    fetchNotifs(session?.data?.user?.id);
  }, [session.data?.user.id]);

  return (
    <div className="h-screen flex flex-col">
      <div className="text-white text-center font-semibold text-lg md:text-2xl py-2 md:py-4 px-2 border-b border-gray-700">
        Notifications
      </div>
      <div className="flex-1 overflow-y-auto p-2 md:p-4">
        {loading && (!notifs || notifs.length === 0) ? (
          <>
            <NotificationSkeleton />
            <NotificationSkeleton />
            <NotificationSkeleton />
          </>
        ) : notifs && notifs.length > 0 ? (
          notifs.map((notif) => (
            <NotificationItem notif={notif} key={notif.id} />
          ))
        ) : (
          <div className="text-center text-gray-400 text-sm md:text-base py-8">
            No notifications
          </div>
        )}
      </div>
    </div>
  );
}
