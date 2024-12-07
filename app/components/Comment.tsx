import axios from "axios";
import Image from "next/image";
import React, { useEffect, useState } from "react";

interface CommentProps {
  comment: string;
  index: number;
  userid: number;
}

const Comment: React.FC<CommentProps> = ({ comment, userid, index }) => {
  const [profilePic, setProfilePic] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const fetchData = async () => {
    const res = await axios.get("/api/users/user", {
      params: { user_id: userid },
    });
    if (res) {
      setProfilePic(res.data.profilePicture);
      setName(res.data.name);
      setUsername(res.data.username);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userid]);

  return (
    <div className="flex gap-4 p-4 border-b-2 border-black">
      <div className="w-12 h-12 rounded-full overflow-hidden">
        <Image
          className="object-cover scale-125"
          src={profilePic}
          alt={profilePic}
          width={64}
          height={64}
        />
      </div>
      <div>
        <div className="flex gap-2">
          <div>{name}</div>
          <div className="text-gray-400">{"@" + username}</div>
        </div>
        <div className="w-full py-2">{comment}</div>
      </div>
    </div>
  );
};

export default Comment;
