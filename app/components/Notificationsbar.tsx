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
      return <FaVoteYea className="text-blue-500 text-lg mr-2" />;
    case "COMMENT":
      return <FaRegComment className="text-green-500 text-lg mr-2" />;
    case "UPVOTE":
      return <FaArrowUp className="text-orange-500 text-lg mr-2" />;
    case "FOLLOW":
      return <FaUserPlus className="text-purple-500 text-lg mr-2" />;
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
    <div className="card flex items-center transition cursor-pointer p-2 mb-1 rounded-md shadow-sm bg-card text-main hover:bg-accent/10 dark:hover:bg-accent/20">
      <div className="flex -space-x-1 mr-2">
        {actors.slice(0, 3).map((actor) => (
          <Image
            key={actor.id}
            src={actor.profilePicture}
            alt={actor.name}
            width={28}
            height={28}
            className="avatar border border-white"
          />
        ))}
        {actors.length === 0 && <div className="avatar bg-gray-200" />}
      </div>
      <div className="flex-1">
        <span className="heading-3 text-sm">{displayText}</span>
        {notif.post_text && (
          <span className="text-gray-800 body-sm text-xs">
            : "{notif.post_text}"
          </span>
        )}
        <div className="text-xs text-gray-400 body-sm">
          {timeAgo(notif.createdAt)}
        </div>
      </div>
      <div className="ml-2 icon accent">{getIcon(notif.type)}</div>
    </div>
  );
}

// Skeleton loader for notifications
export function NotificationSkeleton() {
  return (
    <div className="card animate-pulse flex items-center p-3 mb-2 gap-3">
      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-3 w-1/3 bg-gray-100 dark:bg-gray-800 rounded" />
      </div>
      <div className="ml-2 w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700" />
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
    <div className="bg-card h-screen">
      <div className="text-accent text-center font-semibold text-2xl py-2 bg-card">
        Notifications
      </div>
      <div className="p-2">
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
          <div className="text-center text-gray-500">No notifications</div>
        )}
      </div>
    </div>
  );
}
