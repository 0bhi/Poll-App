import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSession, signIn } from "next-auth/react";
import {
  FaRegComment,
  FaCheck,
  FaRegBookmark,
  FaShareAlt,
} from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";
import {
  BiDownvote,
  BiSolidDownvote,
  BiSolidUpvote,
  BiUpvote,
} from "react-icons/bi";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";

interface PostType {
  id: string;
  text: string;
  options: string[];
  user_id: string;
}

const Post = ({ data }: { data: PostType }) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [profilePicUrl, setProfilePicUrl] = useState("");
  const [votes, setVotes] = useState([0, 0, 0, 0]);
  const [isClicked, setIsClicked] = useState(false);
  const [clickedOption, setClickedOption] = useState(null);
  const [upvoted, setUpvoted] = useState(false);
  const [downvoted, setDownvoted] = useState(false);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  const { id, text, options = [], user_id } = data; // fallback to []

  const fetchData = async () => {
    try {
      // Only fetch if user_id is valid
      if (!user_id) {
        console.warn("user_id is missing, skipping user fetch");
        return;
      }

      const userRes = await axios.get("/api/users/user", {
        params: { user_id: String(user_id) },
      });

      setName(userRes.data.data?.name || "");
      setUsername(userRes.data.data?.username || "");
      if (userRes.data.data?.profilePicture) {
        setProfilePicUrl(userRes.data.data.profilePicture);
      } else {
        const defaultProfilePic = "https://api.dicebear.com/7.x/identicon/svg";
        setProfilePicUrl(defaultProfilePic);
      }
      setCreatedAt(userRes.data.data?.createdAt || new Date().toISOString());

      if (session) {
        const voteRes = await axios.get("/api/votes/vote", {
          params: { postId: id, userId: session.user?.id },
        });
        // API returns { data: vote } where vote can be null or the vote object
        if (voteRes.data.data) {
          setClickedOption(voteRes.data.data.option_id);
          setIsClicked(true);
        }
        // Fetch upvote/downvote status
        try {
          const postVoteRes = await axios.get("/api/postVote", {
            params: { post_id: id, user_id: session.user?.id },
          });
          // API returns { data: { type: ... } }
          const voteType = postVoteRes.data.data?.type;
          if (voteType === "UPVOTE") {
            setUpvoted(true);
            setDownvoted(false);
          } else if (voteType === "DOWNVOTE") {
            setUpvoted(false);
            setDownvoted(true);
          } else {
            setUpvoted(false);
            setDownvoted(false);
          }
        } catch (error: any) {
          // If no vote exists, that's fine
          setUpvoted(false);
          setDownvoted(false);
          if (error.response?.status !== 404) {
            console.error("Error fetching post vote:", error);
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchData();
    const votesArray = (options || []).map(
      (option: any) => option.votes.length
    );
    setVotes(votesArray);
  }, [session, id]);

  const onChoice = async (choice: any, index: number) => {
    if (status === "unauthenticated") {
      signIn(undefined, { callbackUrl: pathname });
      return;
    }
    if (isClicked) return;

    updateVote(index, 1);
    setIsClicked(true);
    setClickedOption(choice.id);

    try {
      const res = await axios.post("/api/votes/vote", {
        name: session?.user?.name,
        user_id: session?.user?.id,
        option_id: choice.id,
        post_id: id,
        postAuthorId: user_id,
      });

      if (!res || res.status < 200 || res.status >= 300) {
        updateVote(index, -1);
        setIsClicked(false);
        setClickedOption(null);
        console.log("Failed to vote:", res?.status, res?.statusText);
      }
    } catch (error) {
      updateVote(index, -1);
      setIsClicked(false);
      setClickedOption(null);
      console.log(error);
    }
  };

  const updateVote = (index: number, increment: number) => {
    const updatedVotes = [...votes];
    updatedVotes[index] += increment;
    setVotes(updatedVotes);
  };

  const handleUpvote = async () => {
    if (status === "unauthenticated") {
      signIn(undefined, { callbackUrl: pathname });
      return;
    }
    if (downvoted) {
      setDownvoted(false);
      setUpvoted(true);
      await axios.post("/api/postVote", {
        user_id: session?.user.id,
        post_id: id,
        type: "UPVOTE",
      });
      return;
    }
    if (!upvoted) {
      setUpvoted(true);
      await axios.post("/api/postVote", {
        user_id: session?.user.id,
        post_id: id,
        type: "UPVOTE",
      });
    } else {
      setUpvoted(false);
      await axios.post("/api/postVote", {
        user_id: session?.user.id,
        post_id: id,
        type: "REMOVE",
      });
    }
    // Optionally, fetch new upvote/downvote counts here and update state
  };

  const handleDownvote = async () => {
    if (status === "unauthenticated") {
      signIn(undefined, { callbackUrl: pathname });
      return;
    }
    if (upvoted) {
      setUpvoted(false);
      setDownvoted(true);
      await axios.post("/api/postVote", {
        user_id: session?.user.id,
        post_id: id,
        type: "DOWNVOTE",
      });
      return;
    }
    if (!downvoted) {
      setDownvoted(true);
      await axios.post("/api/postVote", {
        user_id: session?.user.id,
        post_id: id,
        type: "DOWNVOTE",
      });
    } else {
      setDownvoted(false);
      await axios.post("/api/postVote", {
        user_id: session?.user.id,
        post_id: id,
        type: "REMOVE",
      });
    }
    // Optionally, fetch new upvote/downvote counts here and update state
  };

  const handleShare = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (isSharing) return;
    setIsSharing(true);
    try {
      const url =
        typeof window !== "undefined"
          ? `${window.location.origin}/post/${id}`
          : `/post/${id}`;
      if (navigator?.share) {
        await navigator.share({ url });
      } else if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      }
    } catch (error) {
      console.error("Failed to share post", error);
    } finally {
      setIsSharing(false);
    }
  };

  // Helper to calculate poll percentages
  function getPercentages() {
    const total = votes.reduce((a, b) => a + b, 0);
    if (total === 0) return options.map(() => 0);
    return votes.map((v) => Math.round((v / total) * 100));
  }

  return (
    <div
      className="group transition-all duration-300 ease-in-out cursor-pointer rounded-xl shadow-sm bg-card text-main hover:shadow-xl hover:-translate-y-1 w-full border border-gray-200 dark:border-gray-700 overflow-hidden"
      onClick={() => router.push(`/post/${id}`)}
    >
      {/* Header: Avatar + User Info */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-gray-200 dark:ring-gray-700 transition-all duration-300 group-hover:ring-blue-400 dark:group-hover:ring-blue-500">
            <Image
              src={profilePicUrl}
              alt={`${name}'s profile`}
              className="object-cover w-full h-full"
              width={40}
              height={40}
            />
          </div>
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm md:text-base text-gray-900 dark:text-gray-100 truncate">
              {name || "Anonymous"}
            </span>
            {createdAt && (
              <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                ·
              </span>
            )}
            {createdAt && (
              <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
              </span>
            )}
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
            @{username || "user"}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-4">
        <div className="text-base md:text-lg leading-relaxed mb-4 text-gray-900 dark:text-gray-100 font-medium">
          {text}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(options || []).map((option: any, index: number) => {
            const isSelected = option.id == clickedOption;
            const percentage = getPercentages()[index];
            const hasVotes = votes[index] > 0;

            return (
              <div key={option.id} className="flex flex-col gap-2">
                <button
                  className={`relative rounded-lg py-3 px-4 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 text-sm md:text-base flex items-center gap-2 overflow-hidden min-h-[52px] group/option
                    ${
                      isSelected
                        ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white border-2 border-blue-500 shadow-lg shadow-blue-500/20 scale-[1.02]"
                        : "bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:shadow-md"
                    }
                    ${
                      !isClicked
                        ? "hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                        : "cursor-default"
                    }`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onChoice(option, index);
                  }}
                  disabled={isClicked}
                >
                  {isSelected && (
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                      <FaCheck className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <span className="font-semibold truncate flex-1 text-left">
                    {option.text}
                  </span>
                  {hasVotes && (
                    <span
                      className={`ml-auto text-xs font-semibold flex-shrink-0 px-2 py-1 rounded-full ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {votes[index]}
                    </span>
                  )}

                  {/* Shine effect for selected option */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/option:translate-x-full transition-transform duration-1000" />
                  )}
                </button>

                {/* Poll result bar - show when voted or has votes */}
                {(hasVotes || isClicked) && (
                  <div className="space-y-1.5">
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-700 ease-out rounded-full relative ${
                          isSelected
                            ? "bg-gradient-to-r from-blue-400 to-blue-500"
                            : "bg-gradient-to-r from-blue-500 to-indigo-500"
                        }`}
                        style={{ width: `${percentage}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse-slow" />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span
                        className={`text-xs font-semibold ${
                          isSelected
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {percentage}%
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {votes[index]} {votes[index] === 1 ? "vote" : "votes"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions Row */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30">
        <div className="flex items-center gap-1">
          <button
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              handleUpvote();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95 ${
              upvoted
                ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                : "text-gray-600 dark:text-gray-400"
            }`}
            aria-label="Upvote"
          >
            {upvoted ? (
              <BiSolidUpvote
                size={20}
                className="text-blue-600 dark:text-blue-400"
              />
            ) : (
              <BiUpvote size={20} />
            )}
            <span className="text-xs font-medium hidden sm:inline">Upvote</span>
          </button>
          <button
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              handleDownvote();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95 ${
              downvoted
                ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20"
                : "text-gray-600 dark:text-gray-400"
            }`}
            aria-label="Downvote"
          >
            {downvoted ? (
              <BiSolidDownvote
                size={20}
                className="text-red-600 dark:text-red-400"
              />
            ) : (
              <BiDownvote size={20} />
            )}
            <span className="text-xs font-medium hidden sm:inline">Downvote</span>
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(event) => {
              event.stopPropagation();
              router.push(`/post/${id}`);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95"
            aria-label="Comment"
          >
            <FaRegComment size={16} />
            <span className="text-xs font-medium hidden sm:inline">Comment</span>
          </button>
          <button
            onClick={(event) => {
              event.stopPropagation();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95"
            aria-label="Bookmark"
          >
            <FaRegBookmark size={16} />
            <span className="text-xs font-medium hidden sm:inline">Bookmark</span>
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95"
            aria-label="Share"
          >
            <FaShareAlt size={16} />
            <span className="text-xs font-medium hidden sm:inline">Share</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Skeleton loader for posts
export function PostSkeleton() {
  return (
    <div className="card animate-pulse flex gap-3 md:gap-4 items-start w-full">
      {/* Avatar skeleton */}
      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 animate-pulse-slow flex-shrink-0" />

      <div className="flex-1 space-y-3 md:space-y-4">
        {/* Header skeleton */}
        <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
          <div className="h-3 md:h-4 w-20 md:w-24 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded animate-pulse-slow" />
          <div className="h-3 w-16 md:w-16 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded animate-pulse-slow" />
          <div className="h-3 w-16 md:w-20 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded animate-pulse-slow md:ml-auto" />
        </div>

        {/* Content skeleton */}
        <div className="space-y-2">
          <div className="h-4 md:h-5 w-3/4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded animate-pulse-slow" />
          <div className="h-4 md:h-5 w-1/2 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded animate-pulse-slow" />
        </div>

        {/* Poll options skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 mt-3 md:mt-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-10 md:h-12 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-xl animate-pulse-slow" />
              <div className="h-2 md:h-3 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full animate-pulse-slow" />
            </div>
          ))}
        </div>

        {/* Actions skeleton */}
        <div className="flex gap-4 md:gap-6 mt-3 md:mt-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-8 w-8 md:h-6 md:w-6 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full animate-pulse-slow"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Post;
