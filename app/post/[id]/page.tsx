"use client";

import React, { useRef } from "react";
import { useEffect, useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { FaRegBookmark } from "react-icons/fa6";
import {
  BiDownvote,
  BiUpvote,
  BiSolidUpvote,
  BiSolidDownvote,
} from "react-icons/bi";
import { FiShare2 } from "react-icons/fi";
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
      if (postRes.data) {
        setPost(postRes.data);

        const votesArray = postRes.data.options.map(
          (option: any) => option.votes.length
        );
        setVotes(votesArray);

        const formattedDate = formatDate(postRes.data.createdAt);
        setDate(formattedDate);
      }

      const userRes = await axios.get("/api/users/user", {
        params: { user_id: postRes.data.user_id },
      });

      setName(userRes.data.name);
      setUsername(userRes.data.username);
      if (userRes.data.profilePicture) {
        setProfilePicUrl(userRes.data.profilePicture);
      } else {
        const defaultProfilePic = "https://api.dicebear.com/7.x/identicon/svg";
        setProfilePicUrl(defaultProfilePic);
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
    if (session.status === "authenticated") {
      const voteRes = await axios.get("/api/votes/vote", {
        params: { postId: id, userId: session.data?.user?.id },
      });

      if (voteRes.data.vote) {
        setClickedOption(voteRes.data.vote.option_id);
        if (voteRes.data.vote.user_id === parseInt(session.data?.user?.id)) {
          setIsClicked(true);
        }
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchVotes();
  }, [session.status]);

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
    if (downvoted) {
      setDownvoted(false);
      setUpvoted(true);
      await axios.post("/api/upvote", {
        user_id: session?.data.user?.id,
        post_id: id,
      });
      return;
    }
    if (!upvoted) {
      setUpvoted(true);
      await axios.post("/api/upvote", {
        user_id: session?.data.user?.id,
        post_id: id,
      });
    } else {
      setUpvoted(false);
      await axios.post("/api/remove-upvote", {
        user_id: session?.data.user?.id,
        post_id: id,
      });
    }
  };

  const handleDownvote = async () => {
    if (upvoted) {
      setUpvoted(false);
      setDownvoted(true);
      await axios.post("/api/downvote", {
        user_id: session?.data.user?.id,
        post_id: id,
      });
      return;
    }
    if (!downvoted) {
      setDownvoted(true);
      await axios.post("/api/downvote", {
        user_id: session?.data.user?.id,
        post_id: id,
      });
    } else {
      setDownvoted(false);
      await axios.post("/api/remove-downvote", {
        user_id: session?.data.user?.id,
        post_id: id,
      });
    }
  };

  const handleComment = async () => {
    try {
      const res = await axios.post("/api/comment", {
        postid: id,
        comment: comment,
        userid: session?.data.user?.id,
      });
      if (res && res.data) {
        setComment("");
        setPost((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            comments: [
              ...prev.comments,
              {
                text: comment,
                user_id: session?.data.user?.id,
              },
            ],
          };
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleReplyToComment = async (replyText: string, parentId: number) => {
    try {
      const res = await axios.post("/api/comment", {
        postid: id,
        comment: replyText,
        userid: session?.data.user?.id,
        parentId: parentId,
      });
      if (res && res.data) {
        setPost((prev) => {
          if (!prev) return prev;
          const addReply = (comments: any[]): any[] =>
            comments.map((c) => {
              if (c.id === parentId) {
                return {
                  ...c,
                  replies: [
                    ...(c.replies || []),
                    {
                      ...res.data,
                      text: replyText,
                      user_id: session?.data.user?.id,
                      replies: [],
                    },
                  ],
                };
              } else if (c.replies && c.replies.length > 0) {
                return { ...c, replies: addReply(c.replies) };
              } else {
                return c;
              }
            });
          return {
            ...prev,
            comments: addReply(prev.comments),
          };
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Helper to calculate poll percentages
  function getPercentages() {
    const total = votes.reduce((a, b) => a + b, 0);
    if (total === 0) return post?.options?.map(() => 0) || [];
    return votes.map((v) => Math.round((v / total) * 100));
  }

  return (
    <div className="h-full overflow-y-auto bg-main scrollbar-hide">
      <div className="max-w-4xl mx-auto p-4 space-y-6 pb-8">
        {/* Main Post Card */}
        <div className="card group transition-all duration-300 ease-in-out rounded-xl shadow-sm bg-card text-main hover:shadow-lg">
          {/* Header: Avatar + User Info */}
          <div className="flex items-center gap-3 mb-4">
            <div
              className="avatar overflow-hidden bg-accent/20 cursor-pointer"
              onClick={() => router.push(`/${username}`)}
            >
              <Image
                src={profilePicUrl}
                alt="ProfilePic"
                className="object-cover"
                width={48}
                height={48}
              />
            </div>
            <div className="flex flex-col">
              <h1
                onClick={() => router.push(`/${username}`)}
                className="heading-2 hover:underline cursor-pointer text-main"
              >
                {name}
              </h1>
              <p
                onClick={() => router.push(`/${username}`)}
                className="text-gray-400 body-sm cursor-pointer"
              >
                {"@" + username}
              </p>
            </div>
            <span className="ml-auto text-xs text-gray-500">{date}</span>
          </div>

          {/* Post Content */}
          <div className="mb-6">
            <div className="text-lg leading-relaxed mb-6 text-main">
              {post?.text}
            </div>

            {/* Poll Options */}
            <div className="grid grid-cols-2 gap-4">
              {post?.options?.map((option: any, index: number) => (
                <div key={option.id} className="flex flex-col gap-2">
                  {/* Option number indicator for unvoted polls */}
                  {!isClicked && (
                    <div className="text-xs text-gray-500 font-medium mb-1">
                      Option {index + 1}
                    </div>
                  )}
                  <button
                    className={`relative rounded-xl py-4 px-4 body-lg font-medium transition-all duration-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2 text-sm border-2 flex items-center gap-2 overflow-hidden group
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
                    disabled={isClicked || session.status === "unauthenticated"}
                  >
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
          <div className="flex items-center justify-around px-2 py-3 gap-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleUpvote}
              className={`icon text-blue-700 hover:scale-110 active:scale-95 transition-transform ${
                upvoted ? "font-bold" : ""
              }`}
              aria-label="Upvote"
            >
              {upvoted ? <BiSolidUpvote /> : <BiUpvote />}
            </button>
            <button
              onClick={handleDownvote}
              className={`icon text-red-500 hover:scale-110 active:scale-95 transition-transform ${
                downvoted ? "font-bold" : ""
              }`}
              aria-label="Downvote"
            >
              {downvoted ? <BiSolidDownvote /> : <BiDownvote />}
            </button>
            <button className="icon text-accent hover:scale-110 active:scale-95 transition-transform">
              <FiShare2 />
            </button>
            <button className="icon text-accent hover:scale-110 active:scale-95 transition-transform">
              <FaRegBookmark />
            </button>
          </div>
        </div>

        {/* Comment Section */}
        <div className="card rounded-xl shadow-sm bg-card text-main">
          <h2 className="heading-2 mb-4 text-main">Comments</h2>

          {/* Comment Input */}
          <div className="flex gap-4 mb-6">
            <div className="avatar overflow-hidden bg-accent/20">
              {session.data && (
                <Image
                  src={session?.data.user?.image}
                  alt="ProfilePic"
                  className="object-cover"
                  width={48}
                  height={48}
                />
              )}
            </div>
            <div className="flex-1">
              <textarea
                className="input w-full body-sm bg-card text-main placeholder:text-gray-500 resize-none"
                placeholder="Write a comment..."
                ref={textareaRef}
                onInput={handleInput}
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={handleComment}
                  className="button text-sm py-compact px-compact"
                  disabled={!comment.trim()}
                >
                  Comment
                </button>
              </div>
            </div>
          </div>

          {/* Comments List */}
          <div className="space-y-4">
            {post?.comments?.map((comment, index) => (
              <Comment
                comment={comment.text}
                userid={comment.user_id}
                index={index}
                key={comment.id || index}
                replies={comment.replies}
                onReply={handleReplyToComment}
                commentId={comment.id}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Post;
