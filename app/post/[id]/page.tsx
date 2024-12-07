"use client";

import React, { useRef } from "react";
import { useEffect, useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { FaRegBookmark } from "react-icons/fa6";
import { BiDownvote, BiUpvote } from "react-icons/bi";
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
  const [comments, setComments] = useState([]);

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

    try {
      const res = await axios.post("/api/votes/vote", {
        name: session.data?.user?.name,
        user_id: session.data?.user?.id,
        option_id: choice.id,
        post_id: id,
        postAuthorId: post?.user_id,
      });
      if (res) {
        updateVote(index);
        setIsClicked(true);
        setClickedOption(choice.id);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const updateVote = (index: number) => {
    const updatedVotes = [...votes];
    updatedVotes[index] += 1;
    setVotes(updatedVotes);
  };

  return (
    <div>
      <div className="flex bg-white border-b-2 border-black p-2 space-x-2">
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
            <button className="text-blue-700 text-xl">
              <BiUpvote />
            </button>
            <button className="text-red-700 text-xl">
              <BiDownvote />
            </button>

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
                className="w-full outline-none resize-none w-full"
                name="comment"
                id="1"
                placeholder="Comment"
                ref={textareaRef}
                onInput={handleInput}
                rows={1} // Set initial rows
              ></textarea>
              <div className="flex justify-end">
                <button className=" mr-6 bg-blue-700 text-white font-bold py-2 px-4 rounded">
                  Reply
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {post?.comments.map((comment, index) => {
        return <Comment comment={comment} index={index} />;
      })}
    </div>
  );
};

export default Post;
