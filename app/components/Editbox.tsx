import React, { useState } from "react";
import zod from "zod";
import axios from "axios";
import { useSession } from "next-auth/react";
import { revalidatePath } from "next/cache";

const postSchema = zod.object({
  text: zod.string(),
  options: zod.array(zod.string()),
  user_id: zod.string(),
});

const Editbox = () => {
  const session = useSession();
  const [text, setText] = useState("");
  const [option1, setOption1] = useState("");
  const [option2, setOption2] = useState("");
  const [option3, setOption3] = useState("");
  const [option4, setOption4] = useState("");

  const handleSubmit = async () => {
    try {
      const parsedPost = postSchema.parse({
        text: text,
        options: [option1, option2, option3, option4],
        user_id: (session.data?.user as { id: string } | undefined)?.id,
      });
      if (parsedPost) {
        const res = await axios.post("/api/post", parsedPost);
        if (res) {
          console.log(res);

          setText("");
          setOption1("");
          setOption2("");
          setOption3("");
          setOption4("");
          revalidatePath("/");
          window.location.reload();
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="border-b-2 border-black p-2">
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
                placeholder-neutral-500"
        placeholder="Write a poll..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      ></textarea>
      <div className="grid grid-cols-2 gap-4">
        <input
          className="p-2 m-2 outline-none border-2 border-blue-400"
          placeholder="Option 1"
          value={option1}
          onChange={(e) => setOption1(e.target.value)}
        ></input>

        <input
          className="p-2 m-2 outline-none border-2 border-blue-400"
          placeholder="Option 2"
          value={option2}
          onChange={(e) => setOption2(e.target.value)}
        ></input>
        <input
          className="p-2 m-2 outline-none border-2 border-blue-400"
          placeholder="Option 3"
          value={option3}
          onChange={(e) => setOption3(e.target.value)}
        ></input>
        <input
          className="p-2 m-2 outline-none border-2 border-blue-400"
          placeholder="Option 4"
          value={option4}
          onChange={(e) => setOption4(e.target.value)}
        ></input>
      </div>
      <div className="flex justify-center mt-2">
        <button
          className="bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={handleSubmit}
        >
          Add Poll
        </button>
      </div>
    </div>
  );
};

export default Editbox;
