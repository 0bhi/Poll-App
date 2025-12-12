"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { apiClient, ApiError } from "../_lib/apiClient";
import Image from "next/image";
import { useSession, signIn } from "next-auth/react";
import Post from "../_features/posts/Post";
import { PostSkeleton } from "../_ui/PostSkeleton";
import { FaUserPlus, FaUserCheck } from "react-icons/fa";

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

interface ProfileData {
  id: number;
  name: string;
  username: string;
  bio: string;
  profilePicture: string;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  isSelf: boolean;
  posts: PostType[];
}

const ProfilePage = () => {
  const params = useParams<{ username: string }>();
  const { data: session, status } = useSession();
  const username = useMemo(() => {
    if (!params) return "";
    if (typeof params.username === "string") return params.username;
    return params.username?.[0] || "";
  }, [params]);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchProfile = async () => {
    if (!username) return;
    setLoading(true);
    setError(null);

    try {
      const res = await apiClient.get<ProfileData>("/api/users/profile", {
        params: { username },
      });
      const data = res.data;
      setProfile(data);
      setIsFollowing(data.isFollowing);
      setPosts(data.posts || []);
    } catch (err) {
      const message =
        (err instanceof ApiError && err.message) || "Unable to load this profile.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, status]);

  const handleFollowToggle = async () => {
    if (!profile) return;
    if (status === "unauthenticated") {
      signIn();
      return;
    }
    if (actionLoading) return;

    const nextState = !isFollowing;
    setIsFollowing(nextState);
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            followersCount: prev.followersCount + (nextState ? 1 : -1),
          }
        : prev
    );
    setActionLoading(true);

    try {
      const res = await apiClient.post<{
        isFollowing: boolean;
        followersCount?: number;
      }>("/api/users/follow", {
        target_user_id: profile.id,
        action: nextState ? "FOLLOW" : "UNFOLLOW",
      });
      const data = res.data;
      setIsFollowing(data.isFollowing);
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              followersCount: data.followersCount ?? prev.followersCount,
            }
          : prev
      );
    } catch (err) {
      setIsFollowing((prev) => !prev);
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              followersCount: Math.max(prev.followersCount + (nextState ? -1 : 1), 0),
            }
          : prev
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full overflow-y-auto scrollbar-hide">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-6">
          <div className="bg-card border border-gray-200 dark:border-gray-700 rounded-xl p-6 animate-pulse space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gray-300 dark:bg-gray-700" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-1/3 bg-gray-300 dark:bg-gray-700 rounded" />
                <div className="h-3 w-1/4 bg-gray-200 dark:bg-gray-600 rounded" />
              </div>
            </div>
            <div className="h-3 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="flex gap-6">
              <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
          <div className="space-y-4">
            <PostSkeleton />
            <PostSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="h-full flex items-center justify-center px-4">
        <div className="text-center space-y-3">
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {error || "Profile not found"}
          </div>
          <button
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
            onClick={fetchProfile}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-hide">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-6">
        <div className="bg-card border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden ring-4 ring-gray-100 dark:ring-gray-700">
                <Image
                  src={
                    profile.profilePicture ||
                    "https://api.dicebear.com/7.x/identicon/svg"
                  }
                  alt={`${profile.name}'s profile`}
                  width={96}
                  height={96}
                  className="object-cover w-full h-full"
                />
              </div>
              <div>
                <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {profile.name}
                </div>
                <div className="text-gray-500 dark:text-gray-400">
                  @{profile.username}
                </div>
              </div>
            </div>
            {!profile.isSelf && (
              <button
                onClick={handleFollowToggle}
                disabled={actionLoading}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition ${
                  isFollowing
                    ? "bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                } ${actionLoading ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                {isFollowing ? (
                  <>
                    <FaUserCheck />
                    Following
                  </>
                ) : (
                  <>
                    <FaUserPlus />
                    Follow
                  </>
                )}
              </button>
            )}
          </div>
          {profile.bio && (
            <p className="mt-4 text-gray-700 dark:text-gray-300 whitespace-pre-line">
              {profile.bio}
            </p>
          )}
          <div className="mt-4 flex gap-6 text-sm">
            <div className="text-gray-700 dark:text-gray-300">
              <span className="font-semibold">{profile.followersCount}</span>{" "}
              Followers
            </div>
            <div className="text-gray-700 dark:text-gray-300">
              <span className="font-semibold">{profile.followingCount}</span>{" "}
              Following
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
              No posts yet.
            </div>
          ) : (
            posts.map((post) => <Post key={post.id} data={post} />)
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

