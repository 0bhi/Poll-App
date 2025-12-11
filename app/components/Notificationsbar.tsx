"use client";
import { useSession } from "next-auth/react";
import axios from "axios";
import { useEffect, useState } from "react";
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
    <div className="group transition-all duration-300 ease-in-out cursor-pointer rounded-xl shadow-sm bg-card text-main hover:shadow-xl hover:-translate-y-1 w-full border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="flex items-center gap-4 px-4 py-3">
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-gray-200 dark:ring-gray-700 transition-all duration-300 group-hover:ring-blue-400 dark:group-hover:ring-blue-500">
            {actors.length > 0 ? (
              <Image
                src={actors[0].profilePicture}
                alt={actors[0].name}
                className="object-cover w-full h-full"
                width={40}
                height={40}
              />
            ) : (
              <div className="w-full h-full bg-gray-200 dark:bg-gray-700" />
            )}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm md:text-base text-gray-900 dark:text-gray-100 truncate">
              {displayText}
            </span>
          </div>
          {notif.post_text && (
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
              “{notif.post_text}”
            </p>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {timeAgo(notif.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
}

// Skeleton loader for notifications
export function NotificationSkeleton() {
  return (
    <div className="w-full animate-pulse p-3 md:p-4 mb-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-card overflow-hidden">
      <div className="flex items-center gap-3 md:gap-4">
        <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
        <div className="flex-1 space-y-2">
          <div className="h-3 md:h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-2 md:h-3 w-1/3 bg-gray-100 dark:bg-gray-800 rounded" />
        </div>
        <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  );
}

export default function Notificationsbar() {
  const session: any = useSession();
  const [notifs, setNotifs] = useState<NotificationType[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchNotifs = async () => {
      // Only fetch if user is authenticated
      if (!session?.data?.user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // No need to pass user_id - API uses authenticated user from session
        const res = await axios.get("/api/notifications");
        setNotifs(Array.isArray(res.data.data) ? res.data.data : []);
      } catch (error) {
        setNotifs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifs();
  }, [session?.data?.user?.id]);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="text-gray-100 text-center font-semibold text-lg md:text-2xl py-2 md:py-4 px-2">
        Notifications
      </div>
      <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-2">
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
