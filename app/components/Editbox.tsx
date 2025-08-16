import React, { useState } from "react";
import {
  FaImage,
  FaVideo,
  FaEllipsisH,
  FaLink,
  FaPlus,
  FaRegPaperPlane,
} from "react-icons/fa";
import { useSession } from "next-auth/react";
import axios from "axios";

const BLUE_BG = "bg-blue-700"; // You can adjust this shade as needed

const Editbox = ({ onPostCreated }: { onPostCreated: (post: any) => void }) => {
  const { data: session } = useSession();
  const [text, setText] = useState("");
  const [option1, setOption1] = useState("");
  const [option2, setOption2] = useState("");
  const [option3, setOption3] = useState("");
  const [option4, setOption4] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if user is authenticated
    if (!session?.user?.id) {
      alert("Please sign in to create a poll");
      return;
    }

    // Validate form data
    if (!text.trim()) {
      alert("Please enter a question for your poll");
      return;
    }

    const options = [option1, option2, option3, option4].filter((opt) =>
      opt.trim()
    );
    if (options.length < 2) {
      alert("Please enter at least 2 options for your poll");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post("/api/post", {
        text: text.trim(),
        options: options,
        user_id: session.user.id,
      });

      if (response.data) {
        // Clear form
        setText("");
        setOption1("");
        setOption2("");
        setOption3("");
        setOption4("");

        // Call the callback to add the new post to the feed
        onPostCreated(response.data);
      }
    } catch (error) {
      console.error("Error creating poll:", error);
      alert("Failed to create poll. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      className={`w-full my-4 px-4 md:px-6 rounded-2xl shadow-xl py-4 md:py-6 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 text-white flex flex-col gap-4 md:gap-5 relative overflow-hidden`}
      onSubmit={handleSubmit}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 bg-white/10 rounded-full -translate-y-12 md:-translate-y-16 translate-x-12 md:translate-x-16 blur-2xl" />
      <div className="absolute bottom-0 left-0 w-16 md:w-24 h-16 md:h-24 bg-purple-400/20 rounded-full translate-y-8 md:translate-y-12 -translate-x-8 md:-translate-x-12 blur-xl" />

      {/* Title */}
      <div className="text-xl md:text-2xl font-bold mb-2 relative z-10">
        Create New Poll
      </div>

      {/* Question input */}
      <div className="relative z-10">
        <input
          className="w-full bg-white/10 backdrop-blur-sm text-lg md:text-2xl font-bold placeholder-white/60 outline-none border-2 border-white/20 rounded-xl mb-1 h-12 md:h-14 px-3 md:px-4 transition-all duration-300 focus:border-white/40 focus:bg-white/15"
          placeholder="What's on your mind?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={120}
          autoFocus
        />
      </div>

      {/* Media buttons */}
      <div className="flex gap-2 md:gap-3 items-center mb-2 w-full relative z-10">
        <button
          type="button"
          className="rounded-full border-2 border-white/30 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-lg md:text-xl hover:bg-white/20 hover:scale-110 transition-all duration-300 backdrop-blur-sm"
          tabIndex={-1}
        >
          <FaImage />
        </button>
        <button
          type="button"
          className="rounded-full border-2 border-white/30 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-lg md:text-xl hover:bg-white/20 hover:scale-110 transition-all duration-300 backdrop-blur-sm"
          tabIndex={-1}
        >
          <FaVideo />
        </button>
        <button
          type="button"
          className="rounded-full border-2 border-white/30 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-lg md:text-xl hover:bg-white/20 hover:scale-110 transition-all duration-300 backdrop-blur-sm"
          tabIndex={-1}
        >
          <FaEllipsisH />
        </button>
        <button
          type="button"
          className="rounded-full border-2 border-white/30 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-lg md:text-xl hover:bg-white/20 hover:scale-110 transition-all duration-300 backdrop-blur-sm ml-auto"
          tabIndex={-1}
        >
          <FaLink />
        </button>
      </div>

      {/* Poll options - responsive grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mt-2 relative z-10">
        {[option1, option2, option3, option4].map((opt, idx) => (
          <div
            key={idx}
            className="flex items-center bg-white/10 backdrop-blur-sm rounded-xl px-3 md:px-4 py-2 md:py-3 gap-2 md:gap-3 text-sm md:text-base shadow-lg border border-white/20 hover:bg-white/15 transition-all duration-300"
          >
            <FaPlus className="text-white/70 mr-1 flex-shrink-0" />
            <input
              className="flex-1 bg-transparent outline-none border-none text-white placeholder-white/50 text-sm md:text-base h-8 font-medium min-w-0"
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
            <div className="flex gap-1 md:gap-2 flex-shrink-0">
              <FaImage className="text-white/50 hover:text-white/80 transition-colors cursor-pointer text-sm md:text-base" />
              <FaVideo className="text-white/50 hover:text-white/80 transition-colors cursor-pointer text-sm md:text-base" />
            </div>
          </div>
        ))}
      </div>

      {/* Post button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full mt-3 md:mt-4 py-3 md:py-4 rounded-xl font-bold text-base md:text-lg flex items-center justify-center gap-2 md:gap-3 shadow-xl transition-all duration-300 transform relative z-10 ${
          isSubmitting
            ? "bg-gray-400 text-gray-600 cursor-not-allowed"
            : "bg-white text-blue-700 hover:shadow-2xl hover:bg-blue-50 hover:scale-105 active:scale-95"
        }`}
      >
        <FaRegPaperPlane className={isSubmitting ? "" : "animate-pulse"} />
        <span>{isSubmitting ? "Creating Poll..." : "Create Poll"}</span>
      </button>
    </form>
  );
};

export default Editbox;
