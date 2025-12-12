import React from "react";
import { FaImage, FaVideo, FaPlus } from "react-icons/fa";

interface PollOptionInputProps {
  value: string;
  index: number;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function PollOptionInput({
  value,
  index,
  onChange,
  placeholder,
}: PollOptionInputProps) {
  return (
    <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-xl px-3 md:px-4 py-2 md:py-3 gap-2 md:gap-3 text-sm md:text-base shadow-lg border border-white/20 hover:bg-white/15 transition-all duration-300">
      <FaPlus className="text-white/70 mr-1 flex-shrink-0" />
      <input
        className="flex-1 bg-transparent outline-none border-none text-white placeholder-white/50 text-sm md:text-base h-8 font-medium min-w-0"
        placeholder={placeholder || `Option ${index + 1}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={60}
      />
      <div className="flex gap-1 md:gap-2 flex-shrink-0">
        <FaImage className="text-white/50 hover:text-white/80 transition-colors cursor-pointer text-sm md:text-base" />
        <FaVideo className="text-white/50 hover:text-white/80 transition-colors cursor-pointer text-sm md:text-base" />
      </div>
    </div>
  );
}
