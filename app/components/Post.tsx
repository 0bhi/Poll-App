import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSession, signIn } from "next-auth/react";
import { FaRegComment, FaCheck } from "react-icons/fa";
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

const EMOJI_LIST = [
  { emoji: "👍", label: "Like" },
  { emoji: "❤️", label: "Love" },
  { emoji: "😂", label: "Funny" },
  { emoji: "🎉", label: "Celebrate" },
];

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
  const [reactions, setReactions] = useState<{ [key: string]: number }>({});
  const [userReaction, setUserReaction] = useState<string | null>(null);
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
      // If post has a createdAt, set it (for demo, use now)
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
      await axios.post("/api/upvote", {
        user_id: session?.user.id,
        post_id: id,
      });
      return;
    }
    if (!upvoted) {
      setUpvoted(true);
      await axios.post("/api/upvote", {
        user_id: session?.user.id,
        post_id: id,
      });
    } else {
      setUpvoted(false);
      await axios.post("/api/remove-upvote", {
        user_id: session?.user.id,
        post_id: id,
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
      await axios.post("/api/downvote", {
        user_id: session?.user.id,
        post_id: id,
      });
      return;
    }
    if (!downvoted) {
      setDownvoted(true);
      await axios.post("/api/downvote", {
        user_id: session?.user.id,
        post_id: id,
      });
    } else {
      setDownvoted(false);
      await axios.post("/api/remove-downvote", {
        user_id: session?.user.id,
        post_id: id,
      });
    }
    // Optionally, fetch new upvote/downvote counts here and update state
  };

  // Emoji reaction handler (local state demo)
  const handleReaction = (emoji: string) => {
    if (userReaction === emoji) return;
    setUserReaction(emoji);
    setReactions((prev) => ({ ...prev, [emoji]: (prev[emoji] || 0) + 1 }));
  };

  // Helper to calculate poll percentages
  function getPercentages() {
    const total = votes.reduce((a, b) => a + b, 0);
    if (total === 0) return options.map(() => 0);
    return votes.map((v) => Math.round((v / total) * 100));
  }

  return (
    <div className="card group transition-all duration-300 ease-in-out cursor-pointer rounded-md shadow-sm bg-card text-main hover:shadow-lg hover:-translate-y-0.5 mx-4">
      {/* Header: Avatar + User Info */}
      <div className="flex items-center gap-3 mb-2">
        <div className="avatar overflow-hidden bg-accent/20">
          <Image
            src={profilePicUrl}
            alt="ProfilePic"
            className="object-cover"
            width={36}
            height={36}
          />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-sm leading-tight">{name}</span>
          <span className="text-xs text-gray-400">@{username}</span>
        </div>
        {createdAt && (
          <span className="ml-auto text-xs text-gray-500">
            {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
          </span>
        )}
      </div>
      {/* Content */}
      <div className="mb-3">
        <div className="body-lg text-sm leading-relaxed mb-2">{text}</div>
        <div className="grid grid-cols-2 gap-2">
          {(options || []).map((option: any, index: number) => (
            <div key={option.id} className="flex flex-col gap-1">
              <button
                className={`rounded-md py-compact px-compact body-lg font-medium transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2 text-sm border flex items-center gap-2
                  ${
                    option.id == clickedOption
                      ? "bg-blue-700 text-white border-blue-700"
                      : "bg-accent/10 text-main border-accent/20 hover:bg-accent/20"
                  }
                  hover:scale-105 active:scale-95`}
                onClick={(event) => {
                  event.stopPropagation();
                  onChoice(option, index);
                }}
                disabled={isClicked}
              >
                {option.id == clickedOption && (
                  <FaCheck className="icon mr-1" />
                )}
                {`${option.text} ${votes[index]}`}
              </button>
              {/* Poll result bar */}
              {isClicked && (
                <div className="w-full h-2 bg-accent/10 rounded overflow-hidden mt-0.5">
                  <div
                    className="h-full bg-blue-700 transition-all duration-700"
                    style={{ width: `${getPercentages()[index]}%` }}
                  />
                </div>
              )}
              {isClicked && (
                <div className="text-xs text-gray-600 mt-0.5 text-right">
                  {getPercentages()[index]}%
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      {/* Divider above actions */}
      <div className="border-t border-accent/10 my-2" />
      {/* Actions Row */}
      <div className="flex items-center justify-between px-1 py-1">
        <div className="flex gap-4">
          <button
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              handleUpvote();
            }}
            className={`icon text-accent hover:scale-110 active:scale-95 transition-transform ${
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
            onClick={() => {
              router.push("/post");
            }}
            className="icon text-accent hover:scale-110 active:scale-95 transition-transform"
            aria-label="Comment"
          >
            <FaRegComment />
          </button>
        </div>
        {/* Emoji reactions */}
        <div className="flex gap-2">
          {EMOJI_LIST.map(({ emoji, label }) => (
            <button
              key={emoji}
              className={`text-lg px-2 py-1 rounded-md transition-all duration-150 hover:bg-accent/10 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 ${
                userReaction === emoji
                  ? "scale-110 bg-accent text-white shadow-sm"
                  : "bg-accent/10 text-main"
              }`}
              aria-label={label}
              onClick={() => handleReaction(emoji)}
              disabled={!!userReaction}
            >
              <span role="img" aria-label={label} className="align-middle">
                {emoji}
              </span>
              <span className="ml-1 text-xs font-semibold">
                {reactions[emoji] || 0}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Skeleton loader for posts
export function PostSkeleton() {
  return (
    <div className="card animate-pulse flex gap-4 items-start">
      <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-700" />
      <div className="flex-1 space-y-3">
        <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-3 w-1/4 bg-gray-100 dark:bg-gray-800 rounded" />
        <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="flex gap-4 mt-4">
          <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default Post;
