import React, { useState } from "react";
import { signIn } from "next-auth/react";
import * as z from "zod";
import axios from "axios";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
const postSchema = z.object({
  text: z.string().min(1, "Poll text is required"),
  options: z.array(z.string().min(1)).length(4, "Four options are required"),
  user_id: z.string().min(1, "User ID is required"),
});

interface PostType {
  id: string;
  text: string;
  options: any;
  user_id: string;
}

const Editbox = ({
  onPostCreated,
}: {
  onPostCreated: (post: PostType) => void;
}) => {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [text, setText] = useState("");
  const [option1, setOption1] = useState("");
  const [option2, setOption2] = useState("");
  const [option3, setOption3] = useState("");
  const [option4, setOption4] = useState("");

  const handleSubmit = async () => {
    if (status === "unauthenticated") {
      signIn(undefined, { callbackUrl: pathname });
      return;
    }
    try {
      const parsedPost = postSchema.parse({
        text: text,
        options: [option1, option2, option3, option4],
        user_id: `${session?.user?.id}` || "",
      });
      if (parsedPost) {
        const res = await axios.post("/api/post", parsedPost);
        if (res && res.data) {
          onPostCreated(res.data);
          setText("");
          setOption1("");
          setOption2("");
          setOption3("");
          setOption4("");
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className=" m-2 p-4 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Create a Poll</h2>
      <textarea
        className="
          border-2
          border-blue-400
          resize-none
          w-full
          h-24
          text-xl
          p-3
          outline-none
          placeholder-neutral-500
          rounded-md
          mb-4
        "
        placeholder="Write a poll..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          className="border-2 border-blue-400 w-full p-2 mb-2 rounded-md"
          placeholder="Option 1"
          value={option1}
          onChange={(e) => setOption1(e.target.value)}
        />
        <input
          className="border-2 border-blue-400 w-full p-2 mb-2 rounded-md"
          placeholder="Option 2"
          value={option2}
          onChange={(e) => setOption2(e.target.value)}
        />
        <input
          className="border-2 border-blue-400 w-full p-2 mb-2 rounded-md"
          placeholder="Option 3"
          value={option3}
          onChange={(e) => setOption3(e.target.value)}
        />
        <input
          className="border-2 border-blue-400 w-full p-2 mb-2 rounded-md"
          placeholder="Option 4"
          value={option4}
          onChange={(e) => setOption4(e.target.value)}
        />
      </div>

      <div className="text-right">
        <button
          className="
      bg-blue-500
      text-white
      px-4
      py-2
      rounded-md
      hover:bg-blue-600
      transition
      duration-300
    "
          onClick={handleSubmit}
        >
          Submit
        </button>
      </div>
    </div>
  );
};

export default Editbox;
