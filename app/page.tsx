"use client";
import Editbox from "../app/components/Editbox";
import { useState, useEffect } from "react";
import axios from "axios";
import Post, { PostSkeleton } from "../app/components/Post";
import InfiniteScroll from "react-infinite-scroll-component";

interface PostType {
  id: string;
  text: string;
  options: any;
  user_id: string;
}

export default function Feed() {
  const [posts, setPosts] = useState<PostType[]>([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const res = await axios.get("/api/posts", {
      params: {
        take: 10,
        cursor,
      },
    });

    const newPosts = res.data.posts || [];
    if (cursor) {
      setPosts((prev) => [...prev, ...newPosts]);
    } else {
      setPosts(newPosts);
    }
    setCursor(res.data.nextCursor);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddPost = (newPost: PostType) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-hide pb-20 md:pb-0">
      <div className="max-w-4xl mx-auto px-4 md:px-6">
        <Editbox onPostCreated={handleAddPost} />
        {loading && posts.length === 0 ? (
          <div className="space-y-4">
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </div>
        ) : (
          <InfiniteScroll
            dataLength={posts.length}
            next={() => fetchData()}
            hasMore={!!cursor}
            loader={
              <div className="space-y-4 mt-4">
                <PostSkeleton />
                <PostSkeleton />
              </div>
            }
            endMessage={
              <div className="text-center text-gray-500 py-8 text-sm md:text-base">
                No more posts
              </div>
            }
            className="space-y-4"
          >
            {posts.map((post, index) => (
              <Post key={index} data={post} />
            ))}
          </InfiniteScroll>
        )}
      </div>
    </div>
  );
}
