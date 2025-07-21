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
    const time = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    }).format(date);

    const formattedDate = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
    return `${time} · ${formattedDate}`;
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
    // Optionally, fetch new upvote/downvote counts here and update state
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
    // Optionally, fetch new upvote/downvote counts here and update state
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
        // Add the new comment to the post's comments array instantly
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

  // Add this handler for replying to comments
  const handleReplyToComment = async (replyText: string, parentId: number) => {
    try {
      const res = await axios.post("/api/comment", {
        postid: id,
        comment: replyText,
        userid: session?.data.user?.id,
        parentId: parentId,
      });
      if (res && res.data) {
        // Add the reply to the correct comment in state
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

  return (
    <div className="h-screen overflow-y-auto scrollbar-hide">
      <div className="flex bg-white  m-2 p-2 space-x-2 rounded shadow-lg">
        <div
          className="w-12 h-12 rounded-full overflow-hidden"
          onClick={() => router.push(`/${username}`)}
        >
          <Image
            src={profilePicUrl}
            alt="ProfilePic"
            className="object-cover scale-125"
            width={64}
            height={64}
          />
        </div>

        <div onClick={() => router.push(`/post/${id}`)} className="w-full">
          <div className="flex flex-col pl-2">
            <h1
              onClick={(event) => {
                event.stopPropagation();
                router.push(`/${username}`);
              }}
              className="hover:underline cursor-pointer"
            >
              {name}
            </h1>
            <p
              onClick={(event) => {
                event.stopPropagation();
                router.push(`/${username}`);
              }}
              className="text-gray-400 cursor-pointer"
            >
              {"@" + username}
            </p>
          </div>
          <div className="p-2 my-2">{post?.text}</div>
          <div className="grid grid-cols-2 gap-2">
            {post?.options?.map((option: any, index: number) => (
              <button
                key={option.id}
                className={` ${
                  option.id == clickedOption ? "bg-blue-700" : "bg-blue-500"
                } text-white rounded-md p-2`}
                onClick={(event) => {
                  event.stopPropagation();
                  onChoice(option, index);
                }}
                disabled={isClicked || session.status === "unauthenticated"}
              >
                {`${option.text} ${votes[index]}`}
              </button>
            ))}
          </div>
          <div className="text-gray-500 py-4 text-sm">{date}</div>
          <div style={{ height: "1px" }} className="bg-gray-300 " />
          <div className="flex my-2 mx-2 p-2 justify-around">
            {upvoted ? (
              <button onClick={handleUpvote} className="text-blue-500 text-xl">
                <BiSolidUpvote />
              </button>
            ) : (
              <button onClick={handleUpvote} className="text-blue-500 text-xl">
                <BiUpvote />
              </button>
            )}
            {downvoted ? (
              <button onClick={handleDownvote} className="text-red-700 text-xl">
                <BiSolidDownvote />
              </button>
            ) : (
              <button onClick={handleDownvote} className="text-red-700 text-xl">
                <BiDownvote />
              </button>
            )}

            <button>
              <FiShare2 className="text-xl text-blue-700" />
            </button>
            <button>
              <FaRegBookmark className="text-xl text-blue-700" />
            </button>
          </div>
          <div style={{ height: "1px" }} className="bg-gray-300 " />
          <div className=" p-2 flex gap-4">
            <div
              className="w-12 h-12 rounded-full overflow-hidden"
              onClick={() => router.push(`/${username}`)}
            >
              {session.data && (
                <Image
                  src={session?.data.user?.image}
                  alt="ProfilePic"
                  className="object-cover scale-125"
                  width={64}
                  height={64}
                />
              )}
            </div>
            <div className="w-full">
              <textarea
                className="w-full outline-none resize-none "
                name="comment"
                id="1"
                placeholder="Comment"
                ref={textareaRef}
                onInput={handleInput}
                rows={1}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              ></textarea>
              <div className="flex justify-end">
                <button
                  onClick={handleComment}
                  className=" mr-6 bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Reply
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {post?.comments.map((comment, index) => {
        return (
          <Comment
            comment={comment.text}
            userid={comment.user_id}
            index={index}
            key={comment.id || index}
            replies={comment.replies}
            onReply={handleReplyToComment}
            commentId={comment.id}
          />
        );
      })}
    </div>
  );
};

export default Post;
