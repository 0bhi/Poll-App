import React from "react";
import { FaImage, FaVideo, FaEllipsisH, FaLink } from "react-icons/fa";

export default function MediaToolbar() {
  return (
    <div className="flex gap-2 md:gap-3 items-center mb-2 w-full relative z-10">
      <button
        type="button"
        className="rounded-full border-2 border-white/30 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-lg md:text-xl hover:bg-white/20 hover:scale-110 transition-all duration-300 backdrop-blur-sm"
        tabIndex={-1}
        aria-label="Add image"
      >
        <FaImage />
      </button>
      <button
        type="button"
        className="rounded-full border-2 border-white/30 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-lg md:text-xl hover:bg-white/20 hover:scale-110 transition-all duration-300 backdrop-blur-sm"
        tabIndex={-1}
        aria-label="Add video"
      >
        <FaVideo />
      </button>
      <button
        type="button"
        className="rounded-full border-2 border-white/30 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-lg md:text-xl hover:bg-white/20 hover:scale-110 transition-all duration-300 backdrop-blur-sm"
        tabIndex={-1}
        aria-label="More options"
      >
        <FaEllipsisH />
      </button>
      <button
        type="button"
        className="rounded-full border-2 border-white/30 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-lg md:text-xl hover:bg-white/20 hover:scale-110 transition-all duration-300 backdrop-blur-sm ml-auto"
        tabIndex={-1}
        aria-label="Add link"
      >
        <FaLink />
      </button>
    </div>
  );
}
