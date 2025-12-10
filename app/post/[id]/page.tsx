"use client";

import React, { useRef } from "react";
import { useEffect, useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { FaRegBookmark, FaCheck, FaShareAlt } from "react-icons/fa";
import {
  BiDownvote,
  BiUpvote,
  BiSolidUpvote,
  BiSolidDownvote,
} from "react-icons/bi";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Comment from "@/app/components/Comment";
import { formatDistanceToNow } from "date-fns";

interface PostType {
  id: string;
  text: string;
  options: any;
  user_id: string;
  comments: Array<any>;
}

const Post = () => {
  const session: any = useSession();
  const router = useRouter();
  const { id } = useParams();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [profilePicUrl, setProfilePicUrl] = useState("");
  const [votes, setVotes] = useState([0, 0, 0, 0]);
  const [isClicked, setIsClicked] = useState(false);
  const [clickedOption, setClickedOption] = useState(null);
  const [post, setPost] = useState<PostType>();
  const [date, setDate] = useState("");
  const [upvoted, setUpvoted] = useState(false);
  const [downvoted, setDownvoted] = useState(false);
  const [comment, setComment] = useState("");

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  const handleInput = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  const fetchData = async () => {
    try {
      const postRes = await axios.get("/api/post", {
        params: { postid: id },
      });

      // API returns { data: post }
      const postData = postRes.data.data;
      if (postData) {
        setPost(postData);

        const votesArray = postData.options.map(
          (option: any) => option.votes.length
        );
        setVotes(votesArray);

        const formattedDate = formatDate(postData.createdAt);
        setDate(formattedDate);

        // Fetch user data if user_id exists
        if (postData.user_id) {
          const userRes = await axios.get("/api/users/user", {
            params: { user_id: String(postData.user_id) },
          });

          setName(userRes.data.data?.name || "");
          setUsername(userRes.data.data?.username || "");
          if (userRes.data.data?.profilePicture) {
            setProfilePicUrl(userRes.data.data.profilePicture);
          } else {
            const defaultProfilePic =
              "https://api.dicebear.com/7.x/identicon/svg";
            setProfilePicUrl(defaultProfilePic);
          }
        }
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });
      } else {
        console.error("Unexpected error:", error);
      }
    }
  };

  const fetchVotes = async () => {
    if (session.status === "authenticated" && session.data?.user?.id && id) {
      try {
        // Fetch poll vote status
        const voteRes = await axios.get("/api/votes/vote", {
          params: { postId: String(id), userId: session.data.user.id },
        });

        // API returns { data: vote } where vote can be null or the vote object
        if (voteRes.data.data) {
          setClickedOption(voteRes.data.data.option_id);
          setIsClicked(true);
        }

        // Fetch upvote/downvote status
        const postVoteRes = await axios.get("/api/postVote", {
          params: { post_id: String(id), user_id: session.data.user.id },
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
        // If no vote exists or error occurs, reset states
        console.log("Error fetching votes:", error);
        setUpvoted(false);
        setDownvoted(false);
        if (error.response?.status !== 404) {
          // Only log if it's not a 404 (which is expected when no vote exists)
          console.error(
            "Vote fetch error:",
            error.response?.data || error.message
          );
        }
      }
    } else {
      // Reset states if not authenticated
      setUpvoted(false);
      setDownvoted(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    if (session.status === "authenticated" && id) {
      fetchVotes();
    } else if (session.status === "unauthenticated") {
      // Reset vote states when unauthenticated
      setUpvoted(false);
      setDownvoted(false);
      setIsClicked(false);
      setClickedOption(null);
    }
  }, [session.status, session.data?.user?.id, id]);

  const onChoice = async (choice: any, index: number) => {
    if (isClicked) return;
    updateVote(index, 1);
    setIsClicked(true);
    setClickedOption(choice.id);
    try {
      const res = await axios.post("/api/votes/vote", {
        name: session.data?.user?.name,
        user_id: session.data?.user?.id,
        option_id: choice.id,
        post_id: id,
        postAuthorId: post?.user_id,
      });
      if (!res || res.status < 200 || res.status >= 300) {
        updateVote(index, -1);
        setIsClicked(false);
        setClickedOption(null);
      }
    } catch (error) {
      console.log(error);
      updateVote(index, -1);
      setIsClicked(false);
      setClickedOption(null);
    }
  };

  const updateVote = (index: number, increment: number) => {
    const updatedVotes = [...votes];
    updatedVotes[index] += increment;
    setVotes(updatedVotes);
  };

  const handleUpvote = async () => {
    if (session.status === "unauthenticated" || !session.data?.user?.id) {
      console.log("Not authenticated or no user ID");
      return;
    }

    if (!id) {
      console.log("No post ID");
      return;
    }

    try {
      if (downvoted) {
        setDownvoted(false);
        setUpvoted(true);
        const res = await axios.post("/api/postVote", {
          user_id: session.data.user.id,
          post_id: String(id),
          type: "UPVOTE",
        });
        if (!res || res.status < 200 || res.status >= 300) {
          setDownvoted(true);
          setUpvoted(false);
        }
        return;
      }
      if (!upvoted) {
        setUpvoted(true);
        const res = await axios.post("/api/postVote", {
          user_id: session.data.user.id,
          post_id: String(id),
          type: "UPVOTE",
        });
        if (!res || res.status < 200 || res.status >= 300) {
          setUpvoted(false);
        }
      } else {
        setUpvoted(false);
        const res = await axios.post("/api/postVote", {
          user_id: session.data.user.id,
          post_id: String(id),
          type: "REMOVE",
        });
        if (!res || res.status < 200 || res.status >= 300) {
          setUpvoted(true);
        }
      }
    } catch (error: any) {
      console.error("Error upvoting:", error);
      // Revert state on error
      if (downvoted) {
        setDownvoted(true);
        setUpvoted(false);
      } else {
        setUpvoted(!upvoted);
      }
      if (error.response) {
        console.error("API Error:", error.response.data);
      }
    }
  };

  const handleDownvote = async () => {
    if (session.status === "unauthenticated" || !session.data?.user?.id) {
      console.log("Not authenticated or no user ID");
      return;
    }

    if (!id) {
      console.log("No post ID");
      return;
    }

    try {
      if (upvoted) {
        setUpvoted(false);
        setDownvoted(true);
        const res = await axios.post("/api/postVote", {
          user_id: session.data.user.id,
          post_id: String(id),
          type: "DOWNVOTE",
        });
        if (!res || res.status < 200 || res.status >= 300) {
          setUpvoted(true);
          setDownvoted(false);
        }
        return;
      }
      if (!downvoted) {
        setDownvoted(true);
        const res = await axios.post("/api/postVote", {
          user_id: session.data.user.id,
          post_id: String(id),
          type: "DOWNVOTE",
        });
        if (!res || res.status < 200 || res.status >= 300) {
          setDownvoted(false);
        }
      } else {
        setDownvoted(false);
        const res = await axios.post("/api/postVote", {
          user_id: session.data.user.id,
          post_id: String(id),
          type: "REMOVE",
        });
        if (!res || res.status < 200 || res.status >= 300) {
          setDownvoted(true);
        }
      }
    } catch (error: any) {
      console.error("Error downvoting:", error);
      // Revert state on error
      if (upvoted) {
        setUpvoted(true);
        setDownvoted(false);
      } else {
        setDownvoted(!downvoted);
      }
      if (error.response) {
        console.error("API Error:", error.response.data);
      }
    }
  };

  const handleComment = async () => {
    if (!comment.trim() || !session.data?.user?.id) {
      return;
    }

    try {
      const res = await axios.post("/api/comment", {
        postid: id,
        comment: comment.trim(),
        userid: session.data.user.id,
      });
      if (res && res.data?.data) {
        setComment("");
        // Refetch the post to get the updated comment with all data
        const postRes = await axios.get("/api/post", {
          params: { postid: id },
        });
        if (postRes.data?.data) {
          setPost(postRes.data.data);
          const votesArray = postRes.data.data.options.map(
            (option: any) => option.votes.length
          );
          setVotes(votesArray);
        }
      }
    } catch (error: any) {
      console.error("Error posting comment:", error);
      if (error.response) {
        console.error("API Error:", error.response.data);
      }
    }
  };

  const handleReplyToComment = async (replyText: string, parentId: number) => {
    if (!replyText.trim() || !session.data?.user?.id) {
      return;
    }

    try {
      const res = await axios.post("/api/comment", {
        postid: id,
        comment: replyText.trim(),
        userid: session.data.user.id,
        parentId: parentId,
      });
      if (res && res.data?.data) {
        // Refetch the post to get the updated comment structure with nested replies
        const postRes = await axios.get("/api/post", {
          params: { postid: id },
        });
        if (postRes.data?.data) {
          setPost(postRes.data.data);
          const votesArray = postRes.data.data.options.map(
            (option: any) => option.votes.length
          );
          setVotes(votesArray);
        }
      }
    } catch (error: any) {
      console.error("Error posting reply:", error);
      if (error.response) {
        console.error("API Error:", error.response.data);
      }
    }
  };

  // Helper to calculate poll percentages
  function getPercentages() {
    const total = votes.reduce((a, b) => a + b, 0);
    if (total === 0) return post?.options?.map(() => 0) || [];
    return votes.map((v) => Math.round((v / total) * 100));
  }

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-b from-gray-900 to-gray-800 scrollbar-hide">
      <div className="max-w-4xl mx-auto p-4 space-y-6 pb-8">
        {/* Main Post Card */}
        <div className="group transition-all duration-300 ease-in-out rounded-xl shadow-sm bg-card text-main hover:shadow-xl hover:-translate-y-1 w-full border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header: Avatar + User Info */}
          <div className="flex items-center gap-3 px-4 pt-4 pb-3">
            <div className="relative flex-shrink-0">
              <div
                className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-gray-200 dark:ring-gray-700 transition-all duration-300 group-hover:ring-blue-400 dark:group-hover:ring-blue-500 cursor-pointer"
                onClick={() => router.push(`/${username}`)}
              >
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
                <span
                  onClick={() => router.push(`/${username}`)}
                  className="font-semibold text-sm md:text-base text-gray-900 dark:text-gray-100 truncate cursor-pointer hover:underline"
                >
                  {name || "Anonymous"}
                </span>
                {date && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                    ·
                  </span>
                )}
                {date && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                    {date}
                  </span>
                )}
              </div>
              <span
                onClick={() => router.push(`/${username}`)}
                className="text-xs text-gray-500 dark:text-gray-400 truncate cursor-pointer"
              >
                @{username || "user"}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="px-4 pb-4">
            <div className="text-base md:text-lg leading-relaxed mb-4 text-gray-900 dark:text-gray-100 font-medium">
              {post?.text}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {post?.options?.map((option: any, index: number) => {
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
                          !isClicked && session.status === "authenticated"
                            ? "hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                            : "cursor-default"
                        }`}
                      onClick={(event) => {
                        event.stopPropagation();
                        onChoice(option, index);
                      }}
                      disabled={
                        isClicked || session.status === "unauthenticated"
                      }
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
                            {votes[index]}{" "}
                            {votes[index] === 1 ? "vote" : "votes"}
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
                <span className="text-xs font-medium">Upvote</span>
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
                <span className="text-xs font-medium">Downvote</span>
              </button>
            </div>
            <div className="flex items-center gap-1">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95">
                <FaShareAlt size={16} />
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95">
                <FaRegBookmark size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Comment Section */}
        <div className="group transition-all duration-300 ease-in-out rounded-xl shadow-sm bg-card text-main hover:shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-4 md:px-6 pt-4 pb-4">
            <h2 className="heading-2 mb-4 text-gray-900 dark:text-gray-100">
              Comments
            </h2>

            {/* Comment Input */}
            <div className="flex gap-3 mb-4">
              <div className="relative flex-shrink-0">
                {session.data && (
                  <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-gray-200 dark:ring-gray-700 transition-all duration-300">
                    <Image
                      src={
                        session?.data.user?.image ||
                        "https://api.dicebear.com/7.x/identicon/svg"
                      }
                      alt="Your profile"
                      className="object-cover w-full h-full"
                      width={40}
                      height={40}
                    />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <textarea
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm md:text-base"
                  placeholder="Write a comment..."
                  ref={textareaRef}
                  onInput={handleInput}
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <div className="flex justify-end mt-3">
                  <button
                    onClick={handleComment}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
                      comment.trim()
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg active:scale-95"
                        : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    }`}
                    disabled={!comment.trim()}
                  >
                    Comment
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Comments List */}
          <div className="space-y-4 mt-4 mb-6 mx-2">
            {post?.comments && post.comments.length > 0 ? (
              post.comments.map((comment, index) => (
                <Comment
                  comment={comment.text}
                  userid={comment.user_id}
                  index={index}
                  key={comment.id || index}
                  replies={comment.replies || []}
                  onReply={handleReplyToComment}
                  commentId={comment.id}
                />
              ))
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8 text-sm">
                No comments yet. Be the first to comment!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Post;
