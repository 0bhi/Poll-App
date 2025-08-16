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

  const { id, text, options = [], user_id } = data; // fallback to []

  const fetchData = async () => {
    try {
      const userRes = await axios.get("/api/users/user", {
        params: { user_id },
      });

      setName(userRes.data.name);
      setUsername(userRes.data.username);
      if (userRes.data.profilePicture) {
        setProfilePicUrl(userRes.data.profilePicture);
      } else {
        const defaultProfilePic = "https://api.dicebear.com/7.x/identicon/svg";
        setProfilePicUrl(defaultProfilePic);
      }
      setCreatedAt(userRes.data.createdAt || new Date().toISOString());

      if (session) {
        const voteRes = await axios.get("/api/votes/vote", {
          params: { postId: id, userId: session.user?.id },
        });
        if (voteRes.data.vote) {
          setClickedOption(voteRes.data.vote.option_id);
          if (voteRes.data.vote.user_id === parseInt(session.user?.id)) {
            setIsClicked(true);
          }
        }
        // Fetch upvote/downvote status
        const postVoteRes = await axios.get("/api/postVote", {
          params: { post_id: id, user_id: session.user?.id },
        });
        if (postVoteRes.data.type === "UPVOTE") {
          setUpvoted(true);
          setDownvoted(false);
        } else if (postVoteRes.data.type === "DOWNVOTE") {
          setUpvoted(false);
          setDownvoted(true);
        } else {
          setUpvoted(false);
          setDownvoted(false);
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
  }, []);

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

  // Helper to calculate poll percentages
  function getPercentages() {
    const total = votes.reduce((a, b) => a + b, 0);
    if (total === 0) return options.map(() => 0);
    return votes.map((v) => Math.round((v / total) * 100));
  }

  return (
    <div 
      className="card group transition-all duration-300 ease-in-out cursor-pointer rounded-md shadow-sm bg-card text-main hover:shadow-lg hover:-translate-y-0.5 mx-4"
      onClick={() => router.push(`/post/${id}`)}
    >
      {/* Header: Avatar + User Info */}
      <div className="flex items-center gap-3 mb-2">
        <div
          className="avatar overflow-hidden bg-accent/20"
          style={{ width: 42, height: 42 }}
        >
          <Image
            src={profilePicUrl}
            alt="ProfilePic"
            className="object-cover"
            width={42}
            height={42}
          />
        </div>
        <div className="flex gap-2 ">
          <span className="font-semibold text-md">{name}</span>
          <span className="text-md text-gray-400">@{username}</span>
        </div>
        {createdAt && (
          <span className="ml-auto text-xs text-gray-500">
            {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
          </span>
        )}
      </div>
      {/* Content */}
      <div className="mb-3">
        <div className="text-lg leading-relaxed mb-4">{text}</div>

        <div className="grid grid-cols-2 gap-3">
          {(options || []).map((option: any, index: number) => (
            <div key={option.id} className="flex flex-col gap-2">
              {/* Option number indicator for unvoted polls */}
              {!isClicked && (
                <div className="text-xs text-gray-500 font-medium mb-1">
                  Option {index + 1}
                </div>
              )}
              <button
                className={`relative rounded-xl py-3 px-4 body-lg font-medium transition-all duration-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2 text-sm border-2 flex items-center gap-2 overflow-hidden group
                   ${
                     option.id == clickedOption
                       ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white border-blue-600 shadow-lg transform scale-105"
                       : "bg-gray-800 text-white border-gray-600 hover:border-blue-400 hover:bg-gray-700 hover:shadow-md hover:scale-102"
                   }
                   ${
                     !isClicked
                       ? "hover:scale-102 active:scale-98"
                       : "cursor-default"
                   }`}
                onClick={(event) => {
                  event.stopPropagation();
                  onChoice(option, index);
                }}
                disabled={isClicked}
              >
                {option.id == clickedOption && (
                  <FaCheck className="icon mr-1 animate-pulse" />
                )}
                <span className="font-semibold">{option.text}</span>
                <span
                  className={`ml-auto text-xs ${
                    option.id == clickedOption ? "opacity-90" : "opacity-60"
                  }`}
                >
                  {votes[index]} votes
                </span>

                {/* Animated background for selected option */}
                {option.id == clickedOption && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 animate-pulse-slow" />
                )}

                {/* Subtle hover effect for unselected options */}
                {option.id != clickedOption && !isClicked && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                )}
              </button>

              {/* Enhanced poll result bar - always show when there are votes */}
              {(votes[index] > 0 || isClicked) && (
                <div className="space-y-1">
                  <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-1000 ease-out rounded-full relative"
                      style={{ width: `${getPercentages()[index]}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse-slow" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-300 font-medium">
                      {option.text}
                    </span>
                    <span className="text-blue-400 font-bold">
                      {getPercentages()[index]}%
                    </span>
                  </div>
                </div>
              )}

              {/* Show vote count even when no votes yet */}
              {votes[index] === 0 && !isClicked && (
                <div className="text-xs text-gray-400 text-center mt-1">
                  0 votes
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      {/* Actions Row */}
      <div className="flex items-center justify-around px-1 py-1 gap-4">
        <button
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            handleUpvote();
          }}
          className={`icon text-blue-700 hover:scale-110 active:scale-95 transition-transform ${
            upvoted ? "font-bold" : ""
          }`}
          aria-label="Upvote"
        >
          {upvoted ? <BiSolidUpvote /> : <BiUpvote />}
        </button>
        <button
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            handleDownvote();
          }}
          className={`icon text-red-500 hover:scale-110 active:scale-95 transition-transform ${
            downvoted ? "font-bold" : ""
          }`}
          aria-label="Downvote"
        >
          {downvoted ? <BiSolidDownvote /> : <BiDownvote />}
        </button>
        <button
          onClick={(event) => {
            event.stopPropagation();
            router.push(`/post/${id}`);
          }}
          className="icon text-accent hover:scale-110 active:scale-95 transition-transform"
          aria-label="Comment"
        >
          <FaRegComment />
        </button>
        <button
          onClick={(event) => {
            event.stopPropagation();
          }}
          className="icon text-accent hover:scale-110 active:scale-95 transition-transform"
          aria-label="Bookmark"
        >
          <FaRegBookmark />
        </button>
        <button
          onClick={(event) => {
            event.stopPropagation();
          }}
          className="icon text-accent hover:scale-110 active:scale-95 transition-transform"
          aria-label="Share"
        >
          <FaShareAlt />
        </button>
      </div>
    </div>
  );
};

// Skeleton loader for posts
export function PostSkeleton() {
  return (
    <div className="card animate-pulse flex gap-4 items-start mx-4">
      {/* Avatar skeleton */}
      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 animate-pulse-slow" />

      <div className="flex-1 space-y-4">
        {/* Header skeleton */}
        <div className="flex items-center gap-2">
          <div className="h-4 w-24 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded animate-pulse-slow" />
          <div className="h-3 w-16 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded animate-pulse-slow" />
          <div className="h-3 w-20 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded animate-pulse-slow ml-auto" />
        </div>

        {/* Content skeleton */}
        <div className="space-y-2">
          <div className="h-5 w-3/4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded animate-pulse-slow" />
          <div className="h-5 w-1/2 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded animate-pulse-slow" />
        </div>

        {/* Poll options skeleton */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-12 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-xl animate-pulse-slow" />
              <div className="h-3 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full animate-pulse-slow" />
            </div>
          ))}
        </div>

        {/* Actions skeleton */}
        <div className="flex gap-6 mt-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-6 w-6 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full animate-pulse-slow"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Post;
