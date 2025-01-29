"use client";
import { useSession } from "next-auth/react";
import axios from "axios";
import { useEffect, useState } from "react";

interface NotificationType {
  id: string;
  text: string;
  user_id: string;
  created_at: string;
  type: string;
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
    <div className=" border-l-2 h-screen border-gray-200">
      <div className="text-blue-700 text-center font-semibold text-2xl py-2 border-b-2 border-gray-200">
        Notifications
      </div>

      {notifs && notifs.length > 0 ? (
        notifs.map((notif) => (
          <div
            className="text-black text-m m-2 p-2 text-center rounded shadow-lg"
            key={notif.id}
          >
            {notif.text}
          </div>
        ))
      ) : (
        <div className="text-center text-gray-500">No notifications</div>
      )}
    </div>
  );
}
