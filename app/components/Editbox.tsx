import React, { useState } from "react";
import {
  FaImage,
  FaVideo,
  FaEllipsisH,
  FaLink,
  FaPlus,
  FaRegPaperPlane,
} from "react-icons/fa";

const BLUE_BG = "bg-blue-700"; // You can adjust this shade as needed

const Editbox = ({ onPostCreated }: { onPostCreated: (post: any) => void }) => {
  const [text, setText] = useState("");
  const [option1, setOption1] = useState("");
  const [option2, setOption2] = useState("");
  const [option3, setOption3] = useState("");
  const [option4, setOption4] = useState("");

  // Dummy submit handler for now
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Just clear fields for demo
    setText("");
    setOption1("");
    setOption2("");
    setOption3("");
    setOption4("");
  };

  return (
    <form
      className={`max-w-4xl mx-auto mx-4 my-4 px-4 rounded-2xl shadow-lg py-5 ${BLUE_BG} text-white flex flex-col gap-4`}
      style={{ minWidth: 320 }}
      onSubmit={handleSubmit}
    >
      {/* Title */}
      <div className="text-xl font-bold mb-1">New poll</div>
      {/* Question input */}
      <input
        className="w-full bg-transparent text-2xl font-bold placeholder-white/70 outline-none border-none mb-1 h-12"
        placeholder="Enter your question!"
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={120}
        autoFocus
      />
      {/* Media buttons */}
      <div className="flex gap-3 items-center mb-1 w-full relative">
        <button
          type="button"
          className="rounded-full border-2 border-white/30 w-10 h-10 flex items-center justify-center text-xl hover:bg-white/10 transition"
          tabIndex={-1}
        >
          <FaImage />
        </button>
        <button
          type="button"
          className="rounded-full border-2 border-white/30 w-10 h-10 flex items-center justify-center text-xl hover:bg-white/10 transition"
          tabIndex={-1}
        >
          <FaVideo />
        </button>
        <button
          type="button"
          className="rounded-full border-2 border-white/30 w-10 h-10 flex items-center justify-center text-xl hover:bg-white/10 transition"
          tabIndex={-1}
        >
          <FaEllipsisH />
        </button>
        <button
          type="button"
          className="rounded-full border-2 border-white/30 w-10 h-10 flex items-center justify-center text-xl hover:bg-white/10 transition ml-auto"
          tabIndex={-1}
        >
          <FaLink />
        </button>
      </div>
      {/* Poll options as 2x2 grid */}
      <div className="grid grid-cols-2 gap-4 mt-1">
        {[option1, option2, option3, option4].map((opt, idx) => (
          <div
            key={idx}
            className="flex items-center bg-black/80 rounded-2xl px-3 py-2 gap-2 text-base shadow"
          >
            <FaPlus className="text-white/60 mr-1" />
            <input
              className="flex-1 bg-transparent outline-none border-none text-white placeholder-white/50 text-base h-8"
              placeholder={`Option ${idx + 1}`}
              value={opt}
              onChange={(e) => {
                if (idx === 0) setOption1(e.target.value);
                else if (idx === 1) setOption2(e.target.value);
                else if (idx === 2) setOption3(e.target.value);
                else setOption4(e.target.value);
              }}
              maxLength={60}
            />
            <FaImage className="text-white/40 mx-1" />
            <FaVideo className="text-white/40" />
          </div>
        ))}
      </div>
      {/* Post button */}
      <button
        type="submit"
        className="w-full mt-3 py-3 rounded-full bg-white text-blue-700 font-bold text-lg flex items-center justify-center gap-2 shadow-md hover:bg-blue-100 transition"
      >
        <FaRegPaperPlane /> POST
      </button>
    </form>
  );
};

export default Editbox;
