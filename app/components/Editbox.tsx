import React, { useState, useMemo } from "react";
import { signIn } from "next-auth/react";
import * as z from "zod";
import axios from "axios";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { moderateText } from "../lib/moderation";
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

const BANNED_WORDS = ["badword", "offensive", "hate"];
const HASHTAG_SUGGESTIONS = [
  "#poll",
  "#question",
  "#opinion",
  "#vote",
  "#fun",
  "#trending",
  "#social",
  "#community",
];
const POLL_OPTION_SUGGESTIONS: { [key: string]: string[] } = {
  color: ["Red", "Blue", "Green", "Yellow"],
  food: ["Pizza", "Burger", "Pasta", "Salad"],
  pet: ["Dog", "Cat", "Bird", "Fish"],
  sport: ["Football", "Basketball", "Cricket", "Tennis"],
};

function getHashtagSuggestions(text: string) {
  if (!text) return [];
  return HASHTAG_SUGGESTIONS.filter((tag) =>
    tag.includes(text.replace(/[^a-zA-Z]/g, "").toLowerCase())
  ).slice(0, 4);
}

function getOptionSuggestions(text: string) {
  if (!text) return [];
  const lower = text.toLowerCase();
  for (const key in POLL_OPTION_SUGGESTIONS) {
    if (lower.includes(key)) return POLL_OPTION_SUGGESTIONS[key];
  }
  return [];
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
  const [error, setError] = useState("");

  // AI-driven suggestions
  const hashtagSuggestions = useMemo(() => getHashtagSuggestions(text), [text]);
  const optionSuggestions = useMemo(() => getOptionSuggestions(text), [text]);

  const handleSubmit = async () => {
    // Content moderation: check for banned words
    const allText = [text, option1, option2, option3, option4]
      .join(" ")
      .toLowerCase();
    if (BANNED_WORDS.some((w) => allText.includes(w))) {
      setError("Your poll contains inappropriate language. Please revise.");
      return;
    }
    // Advanced moderation: OpenAI API
    setError("");
    const modResult = await moderateText(
      [text, option1, option2, option3, option4].join(" ")
    );
    if (modResult.flagged) {
      setError(
        "Your poll was flagged for inappropriate content by our moderation system." +
          (modResult.categories
            ? " (Categories: " +
              Object.entries(modResult.categories)
                .filter(([k, v]) => v)
                .map(([k]) => k)
                .join(", ") +
              ")"
            : "")
      );
      return;
    }
    if (modResult.error) {
      setError("Moderation error: " + modResult.error);
      return;
    }
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
    <div className="card rounded-md shadow-sm bg-card text-main p-3">
      <h2 className="heading-1 mb-2 text-base font-semibold">Create a Poll</h2>
      <textarea
        className="w-full rounded-md border border-accent/10 dark:border-[#374151] bg-accent/5 dark:bg-[#23272a] text-main placeholder:text-gray-400 p-2 mb-2 resize-none focus:ring-2 focus:ring-accent focus:outline-none transition text-sm"
        placeholder="Write a poll..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
      />
      {/* Hashtag suggestions */}
      {hashtagSuggestions.length > 0 && (
        <div className="flex gap-1 flex-wrap mb-1">
          {hashtagSuggestions.map((tag) => (
            <span
              key={tag}
              className="bg-accent/10 text-accent px-2 py-1 rounded-md text-xs cursor-pointer hover:bg-accent/20"
              onClick={() => setText((t) => t + " " + tag)}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      {/* Poll option suggestions */}
      {optionSuggestions.length > 0 && (
        <div className="flex gap-1 flex-wrap mb-1">
          <span className="text-xs text-gray-500 mr-2">Suggestions:</span>
          {optionSuggestions.map((opt, idx) => (
            <span
              key={opt}
              className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs cursor-pointer hover:bg-blue-200"
              onClick={() => {
                if (!option1) setOption1(opt);
                else if (!option2) setOption2(opt);
                else if (!option3) setOption3(opt);
                else if (!option4) setOption4(opt);
              }}
            >
              {opt}
            </span>
          ))}
        </div>
      )}
      {/* Error message */}
      {error && <div className="text-red-500 text-xs mb-1">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-1 mb-2">
        <input
          className="rounded-md border border-accent/10 dark:border-[#374151] bg-accent/5 dark:bg-[#23272a] text-main placeholder:text-gray-400 p-2 text-sm focus:ring-2 focus:ring-accent focus:outline-none transition"
          placeholder="Option 1"
          value={option1}
          onChange={(e) => setOption1(e.target.value)}
        />
        <input
          className="rounded-md border border-accent/10 dark:border-[#374151] bg-accent/5 dark:bg-[#23272a] text-main placeholder:text-gray-400 p-2 text-sm focus:ring-2 focus:ring-accent focus:outline-none transition"
          placeholder="Option 2"
          value={option2}
          onChange={(e) => setOption2(e.target.value)}
        />
        <input
          className="rounded-md border border-accent/10 dark:border-[#374151] bg-accent/5 dark:bg-[#23272a] text-main placeholder:text-gray-400 p-2 text-sm focus:ring-2 focus:ring-accent focus:outline-none transition"
          placeholder="Option 3"
          value={option3}
          onChange={(e) => setOption3(e.target.value)}
        />
        <input
          className="rounded-md border border-accent/10 dark:border-[#374151] bg-accent/5 dark:bg-[#23272a] text-main placeholder:text-gray-400 p-2 text-sm focus:ring-2 focus:ring-accent focus:outline-none transition"
          placeholder="Option 4"
          value={option4}
          onChange={(e) => setOption4(e.target.value)}
        />
      </div>
      <div className="flex justify-end mt-1">
        <button
          className="button px-5 py-1.5 rounded-md font-medium shadow-sm bg-accent text-white hover:bg-accent-hover transition text-sm"
          onClick={handleSubmit}
        >
          Submit
        </button>
      </div>
    </div>
  );
};

export default Editbox;
