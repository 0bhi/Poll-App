"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { apiClient } from "../_lib/apiClient";
import Image from "next/image";
import { FaSearch, FaUser } from "react-icons/fa";
import { logger } from "../_lib/logger";
import { useDebounce } from "../_hooks";

interface SearchUser {
  id: number;
  name: string;
  username: string;
  profilePicture: string | null;
  bio: string | null;
}

export default function SearchPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Use debounce hook
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    const performSearch = async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setHasSearched(false);
        return;
      }

      if (status !== "authenticated" || !session?.user?.id) {
        setResults([]);
        setHasSearched(true);
        return;
      }

      setLoading(true);
      setHasSearched(true);

      try {
        const res = await apiClient.get<SearchUser[]>("/api/users/search", {
          params: {
            q: searchQuery.trim(),
            current_user_id: session.user.id,
          },
        });

        setResults(res.data || []);
      } catch (error: unknown) {
        logger.error("Search error", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    performSearch(debouncedQuery);
  }, [debouncedQuery, session?.user?.id, status]);

  const handleUserClick = (username: string) => {
    router.push(`/${username}`);
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-hide pb-20 md:pb-0">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-4 md:py-6">
        {/* Search Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Search People
          </h1>

          {/* Search Input */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <FaSearch size={20} />
            </div>
            <input
              type="text"
              placeholder="Search by name or username..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 md:py-4 bg-card border-2 border-gray-200 dark:border-gray-700 rounded-xl text-base md:text-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
              autoFocus
            />
            {loading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="spinner" />
              </div>
            )}
          </div>
        </div>

        {/* Search Results */}
        <div className="space-y-3">
          {!hasSearched && query.trim() === "" ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <FaSearch className="mx-auto text-5xl mb-4 opacity-30" />
              <p className="text-lg font-medium">Start typing to search for people</p>
              <p className="text-sm mt-2">Search by name or username</p>
            </div>
          ) : hasSearched && !loading && results.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <FaUser className="mx-auto text-5xl mb-4 opacity-30" />
              <p className="text-lg font-medium">No users found</p>
              <p className="text-sm mt-2">Try a different search term</p>
            </div>
          ) : status !== "authenticated" ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <FaUser className="mx-auto text-5xl mb-4 opacity-30" />
              <p className="text-lg font-medium">Please sign in to search</p>
            </div>
          ) : (
            results.map((user) => (
              <div
                key={user.id}
                onClick={() => handleUserClick(user.username)}
                className="group cursor-pointer bg-card border border-gray-200 dark:border-gray-700 rounded-xl p-4 md:p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden ring-2 ring-gray-200 dark:ring-gray-700 group-hover:ring-blue-400 dark:group-hover:ring-blue-500 transition-all">
                      <Image
                        src={
                          user.profilePicture ||
                          "https://api.dicebear.com/7.x/identicon/svg"
                        }
                        alt={`${user.name}'s profile`}
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-base md:text-lg text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {user.name}
                      </h3>
                    </div>
                    <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 truncate">
                      @{user.username}
                    </p>
                    {user.bio && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
                        {user.bio}
                      </p>
                    )}
                  </div>

                  {/* Arrow indicator */}
                  <div className="flex-shrink-0 text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Loading skeleton */}
          {loading && (
            <>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-card border border-gray-200 dark:border-gray-700 rounded-xl p-4 md:p-5 animate-pulse"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gray-200 dark:bg-gray-700" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded" />
                      <div className="h-3 w-1/4 bg-gray-200 dark:bg-gray-700 rounded" />
                      <div className="h-3 w-2/3 bg-gray-200 dark:bg-gray-700 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

