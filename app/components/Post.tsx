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
  options: any;
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

    try {
      const res = await axios.post("/api/votes/vote", {
        name: session.data?.user?.name,
        user_id: session.data?.user?.id,
        option_id: choice.id,
        post_id: id,
        postAuthorId: user_id,
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

  const handleUpvote = async () => {
    if (downvoted) {
      await axios.post("/api/downvote", { id: id });
      setDownvoted(false);
    }

    if (!upvoted) {
      await axios.post("/api/upvote", { id: id });
      setUpvoted(true);
    } else {
      await axios.post("/api/remove-upvote", { id: id });
      setUpvoted(false);
    }
  };

  const handleDownvote = async () => {
    if (upvoted) {
      await axios.post("/api/remove-upvote", { id: id });
      setUpvoted(false);
    }

    if (!downvoted) {
      await axios.post("/api/downvote", { id: id });
      setDownvoted(true);
    } else {
      await axios.post("/api/remove-downvote", { id: id });
      setDownvoted(false);
    }
  };

  const updateVote = (index: number) => {
    const updatedVotes = [...votes];
    updatedVotes[index] += 1;
    setVotes(updatedVotes);
  };

  return (
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
              console.log("clicked");
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
