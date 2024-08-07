"use client";
import Editbox from "./Editbox";
import { useState, useEffect } from "react";
import axios from "axios";
import Post from "./Post";

interface PostType {
  id: string;
  text: string;
  options: any;
  user_id: string;
}

export default function Feed() {
  const [posts, setPosts] = useState([]);

  const fetchData = async () => {
    const res = await axios.get("/api/posts");
    setPosts(res.data);
  };

  useEffect(() => {
    fetchData();
  }, []);
  return (
    <div className=" bg-blue-200 ">
      <Editbox />
      {posts.map((post: PostType, index) => (
        <Post key={index} data={post} />
      ))}
    </div>
  );
}
