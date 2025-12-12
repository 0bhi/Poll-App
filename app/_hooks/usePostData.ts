import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { apiClient } from "../_lib/apiClient";
import { logger } from "../_lib/logger";

interface PostOption {
  id: number;
  text: string;
  votes?: Array<{ id: number }>;
}

interface PostType {
  id: string;
  text: string;
  options: PostOption[];
  user_id: string;
}

interface UserData {
  name: string;
  username: string;
  profilePicture?: string;
  createdAt: string;
}

interface VoteData {
  option_id: number;
}

interface UsePostDataOptions {
  postId: string;
  userId: string;
  options?: PostOption[];
  enabled?: boolean;
}

export function usePostData({
  postId,
  userId,
  options = [],
  enabled = true,
}: UsePostDataOptions) {
  const { data: session } = useSession();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [profilePicUrl, setProfilePicUrl] = useState("");
  const [votes, setVotes] = useState<number[]>([]);
  const [isClicked, setIsClicked] = useState(false);
  const [clickedOption, setClickedOption] = useState<number | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || !userId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const userRes = await apiClient.get<UserData>("/api/users/user", {
          params: { user_id: String(userId) },
        });

        setName(userRes.data?.name || "");
        setUsername(userRes.data?.username || "");
        if (userRes.data?.profilePicture) {
          setProfilePicUrl(userRes.data.profilePicture);
        } else {
          const defaultProfilePic = "https://api.dicebear.com/7.x/identicon/svg";
          setProfilePicUrl(defaultProfilePic);
        }
        setCreatedAt(userRes.data?.createdAt || new Date().toISOString());

        // Initialize votes from options
        const votesArray = (options || []).map(
          (option: PostOption) => (option.votes || []).length
        );
        setVotes(votesArray);

        // Fetch user's vote if authenticated
        if (session?.user?.id) {
          try {
            const voteRes = await apiClient.get<VoteData | null>("/api/votes/vote", {
              params: { postId, userId: session.user.id },
            });
            if (voteRes.data) {
              setClickedOption(voteRes.data.option_id);
              setIsClicked(true);
            }
          } catch (voteError) {
            // Vote not found is okay
            if (apiClient.isApiError(voteError) && voteError.statusCode !== 404) {
              logger.error("Error fetching vote", voteError);
            }
          }
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to fetch post data");
        logger.error("Error fetching post data", error);
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [postId, userId, session, options, enabled]);

  const updateVote = (index: number, increment: number) => {
    const updatedVotes = [...votes];
    updatedVotes[index] += increment;
    setVotes(updatedVotes);
  };

  return {
    name,
    username,
    profilePicUrl,
    votes,
    isClicked,
    clickedOption,
    createdAt,
    loading,
    error,
    setIsClicked,
    setClickedOption,
    updateVote,
  };
}

