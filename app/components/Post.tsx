import React from "react";
import { useEffect, useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";

interface PostType {
  id: string;
  text: string;
  options: any;
  user_id: string;
}

const Post = ({ data }: { data: PostType }) => {
  const session: any = useSession();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [votes, setVotes] = useState([0, 0, 0, 0]);
  const [isClicked, setIsClicked] = useState(false);
  const [clickedOption, setClickedOption] = useState(null);

  const { id, text, options, user_id } = data;

  const fetchData = async () => {
    try {
      const userRes = await axios.get("/api/users/user", {
        params: { user_id },
      });

      setName(userRes.data.name);
      setUsername(userRes.data.username);

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

  const updateVote = (index: number) => {
    const updatedVotes = [...votes];
    updatedVotes[index] += 1;
    setVotes(updatedVotes);
  };

  return (
    <div className="bg-white border-b-2 border-black p-2">
      <div className="flex gap-2 pl-2">
        <h1>{name}</h1>
        <p className="text-gray-400 ">{"@" + username}</p>
      </div>
      <div className="p-2">{text}</div>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option: any, index: number) => (
          <button
            key={option.id}
            className={` ${
              option.id == clickedOption ? "bg-blue-700" : "bg-blue-500"
            } text-white rounded-md p-2`}
            onClick={() => onChoice(option, index)}
            disabled={isClicked || session.status === "unauthenticated"}
          >
            {`${option.text} ${votes[index]}`}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Post;
