import React from "react";
import { useEffect, useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { FaRegComment } from "react-icons/fa";
import {
  BiDownvote,
  BiSolidDownvote,
  BiSolidUpvote,
  BiUpvote,
} from "react-icons/bi";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface PostType {
  id: string;
  text: string;
  options: string[];
  user_id: string;
}

const Post = ({ data }: { data: PostType }) => {
  const session: any = useSession();
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [profilePicUrl, setProfilePicUrl] = useState("");
  const [votes, setVotes] = useState([0, 0, 0, 0]);
  const [isClicked, setIsClicked] = useState(false);
  const [clickedOption, setClickedOption] = useState(null);
  const [upvoted, setUpvoted] = useState(false);
  const [downvoted, setDownvoted] = useState(false);

  const { id, text, options, user_id } = data;

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

      if (session) {
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
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchData();
    const votesArray = options.map((option: any) => option.votes.length);
    setVotes(votesArray);
  }, []);

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
    if (downvoted) {
      setDownvoted(false);
      setUpvoted(true);
      const res = await axios.post("/api/downvote", { id: id });
      if (res.status < 200 || res.status >= 300) {
        setDownvoted(true);
        setUpvoted(false);
      }
      return;
    }

    if (!upvoted) {
      setUpvoted(true);
      const res = await axios.post("/api/upvote", { id: id });
      if (res.status < 200 || res.status >= 300) {
        setUpvoted(false);
      }
    } else {
      setUpvoted(false);
      const res = await axios.post("/api/remove-upvote", { id: id });
      if (res.status < 200 || res.status >= 300) {
        setUpvoted(true);
      }
    }
  };

  const handleDownvote = async () => {
    if (upvoted) {
      setUpvoted(false);
      setDownvoted(true);
      const res = await axios.post("/api/remove-upvote", { id: id });
      if (res.status < 200 || res.status >= 300) {
        setDownvoted(false);
        setUpvoted(true);
      }
      return;
    }

    if (!downvoted) {
      setDownvoted(true);
      const res = await axios.post("/api/downvote", { id: id });
      if (res.status < 200 || res.status >= 300) {
        setDownvoted(false);
      }
    } else {
      setDownvoted(false);
      const res = await axios.post("/api/remove-downvote", { id: id });
      if (res.status < 200 || res.status >= 300) {
        setDownvoted(true);
      }
    }
  };

  return (
    <div className="flex bg-white shadow-lg p-4 space-x-4 m-4 rounded-lg hover:shadow-xl transition-all duration-300 ease-in-out">
      <div
        className="w-14 h-14 rounded-full overflow-hidden cursor-pointer"
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
        <div className="flex gap-2 pl-2">
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
        <div className="p-2">{text}</div>
        <div className="grid grid-cols-2 gap-2">
          {options.map((option: any, index: number) => (
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
        <div className="flex mt-2 mx-2 p-2 justify-around">
          <button
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              handleUpvote();
            }}
            className="text-blue-700 text-xl"
          >
            {upvoted ? <BiSolidUpvote /> : <BiUpvote />}
          </button>
          <button
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              handleDownvote();
            }}
            className="text-red-700 text-xl"
          >
            {downvoted ? <BiSolidDownvote /> : <BiDownvote />}
          </button>
          <button
            onClick={() => {
              router.push("/post");
            }}
            className="text-blue-700 text-xl"
          >
            <FaRegComment />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Post;
