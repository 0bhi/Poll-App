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
    <div className="flex items-center bg-white rounded-lg shadow p-3 mb-2 hover:bg-blue-50 transition cursor-pointer">
      <div className="flex -space-x-2 mr-3">
        {actors.slice(0, 3).map((actor) => (
          <Image
            key={actor.id}
            src={actor.profilePicture}
            alt={actor.name}
            width={32}
            height={32}
            className="rounded-full border-2 border-white"
          />
        ))}
        {actors.length === 0 && (
          <div className="w-10 h-10 rounded-full bg-gray-200" />
        )}
      </div>
      <div className="flex-1">
        <span className="font-bold">{displayText}</span>
        {notif.post_text && (
          <span className="text-gray-800 font-medium">
            : "{notif.post_text}"
          </span>
        )}
        <div className="text-xs text-gray-400">{timeAgo(notif.createdAt)}</div>
      </div>
      <div className="ml-2">{getIcon(notif.type)}</div>
    </div>
  );
}

export default function Notificationsbar() {
  const session: any = useSession();
  const [notifs, setNotifs] = useState<NotificationType[]>([]);
  useEffect(() => {
    const fetchNotifs = async (userId: string) => {
      try {
        const res = await axios.get("/api/notifications", {
          params: { user_id: userId },
        });
        setNotifs(res.data.notifications);
      } catch (error) {
        console.log(error);
      }
    };
    fetchNotifs(session?.data?.user?.id);
  }, [session.data?.user.id]);

  return (
    <div className="border-l-2 h-screen border-gray-200 bg-gray-50">
      <div className="text-blue-700 text-center font-semibold text-2xl py-2 border-b-2 border-gray-200">
        Notifications
      </div>
      <div className="p-2">
        {notifs && notifs.length > 0 ? (
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
