"use client";
import Editbox from "./_features/posts/Editbox";
import { useState } from "react";
import Post from "./_features/posts/Post";
import { PostSkeleton } from "./_ui/PostSkeleton";
import InfiniteScroll from "react-infinite-scroll-component";
import { FaPlus } from "react-icons/fa";
import { useInfiniteScroll, useIntersectionObserver } from "./_hooks";

interface PostOption {
  id: number;
  text: string;
  votes?: Array<{ id: number }>;
}

interface PostType {
  id: string;
  text: string;
  options: PostOption[];
  user_id: string;
}

export default function Feed() {
  const [composerRef, isComposerVisible] = useIntersectionObserver({
    threshold: 0.1,
  });

  const {
    items: rawPosts,
    loading,
    hasMore,
    loadMore,
    refetch,
  } = useInfiniteScroll<any>({
    endpoint: "/api/posts",
    take: 10,
  });

  // Transform posts to match PostType interface (convert id and user_id to strings)
  const posts: PostType[] = rawPosts.map((post: any) => ({
    ...post,
    id: String(post.id),
    user_id: String(post.user_id),
  }));

  const handleAddPost = (newPost: PostType) => {
    // Refetch to show new post at top
    // Note: In a real app, you might want to add it optimistically
    refetch();
  };

  const scrollToComposer = () => {
    if (composerRef.current) {
      composerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-hide pb-28 md:pb-0 relative">
      <div className="max-w-4xl mx-auto px-4 md:px-6">
        <div ref={composerRef}>
          <Editbox onPostCreated={handleAddPost} />
        </div>
        {loading && posts.length === 0 ? (
          <div className="space-y-4">
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </div>
        ) : (
          <InfiniteScroll
            dataLength={posts.length}
            next={loadMore}
            hasMore={hasMore}
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

      {/* Mobile floating composer shortcut */}
      {!isComposerVisible && (
        <button
          onClick={scrollToComposer}
          className="md:hidden fixed bottom-20 right-4 z-40 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl shadow-blue-500/30 w-12 h-12 flex items-center justify-center active:scale-95 hover:scale-105 transition-transform mobile-safe-area"
          aria-label="Create a new poll"
        >
          <FaPlus className="text-base" />
        </button>
      )}
    </div>
  );
}
