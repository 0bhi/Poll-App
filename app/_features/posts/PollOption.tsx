import React from "react";
import { FaCheck } from "react-icons/fa";

interface PostOption {
  id: number;
  text: string;
  votes?: Array<{ id: number }>;
}

interface PollOptionProps {
  option: PostOption;
  index: number;
  isSelected: boolean;
  isClicked: boolean;
  votes: number;
  percentage: number;
  onChoice: (option: PostOption, index: number) => void;
}

export default function PollOption({
  option,
  index,
  isSelected,
  isClicked,
  votes,
  percentage,
  onChoice,
}: PollOptionProps) {
  const hasVotes = votes > 0;

  return (
    <div className="flex flex-col gap-2">
      <button
        className={`relative rounded-lg py-3 px-4 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 text-sm md:text-base flex items-center gap-2 overflow-hidden min-h-[52px] group/option
          ${
            isSelected
              ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white border-2 border-blue-500 shadow-lg shadow-blue-500/20 scale-[1.02]"
              : "bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:shadow-md"
          }
          ${
            !isClicked
              ? "hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              : "cursor-default"
          }`}
        onClick={(event) => {
          event.stopPropagation();
          onChoice(option, index);
        }}
        disabled={isClicked}
      >
        {isSelected && (
          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
            <FaCheck className="w-3 h-3 text-white" />
          </div>
        )}
        <span className="font-semibold truncate flex-1 text-left">
          {option.text}
        </span>
        {hasVotes && (
          <span
            className={`ml-auto text-xs font-semibold flex-shrink-0 px-2 py-1 rounded-full ${
              isSelected
                ? "bg-white/20 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            {votes}
          </span>
        )}

        {/* Shine effect for selected option */}
        {isSelected && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/option:translate-x-full transition-transform duration-1000" />
        )}
      </button>

      {/* Poll result bar - show when voted or has votes */}
      {(hasVotes || isClicked) && (
        <div className="space-y-1.5">
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-700 ease-out rounded-full relative ${
                isSelected
                  ? "bg-gradient-to-r from-blue-400 to-blue-500"
                  : "bg-gradient-to-r from-blue-500 to-indigo-500"
              }`}
              style={{ width: `${percentage}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse-slow" />
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span
              className={`text-xs font-semibold ${
                isSelected
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              {percentage}%
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {votes} {votes === 1 ? "vote" : "votes"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
