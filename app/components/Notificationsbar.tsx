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
        console.log("userID:", userId);
        const res = await axios.get("/api/notifications", {
          params: { user_id: userId },
        });
        console.log(res.data.notifications);
        setNotifs(res.data.notifications);
      } catch (error) {
        console.log(error);
      }
    };
    fetchNotifs(session?.data?.user?.id);
  }, [session.data?.user.id]);

  return (
    <div className="border-l-2 h-screen border-black">
      <div className="text-blue-700 text-center font-semibold text-2xl py-2 border-b-2 border-black">
        Notifications
      </div>

      {notifs && notifs.length > 0 ? (
        notifs.map((notif) => (
          <div
            className="text-black text-m py-2 text-center border-b-2 border-grey"
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
