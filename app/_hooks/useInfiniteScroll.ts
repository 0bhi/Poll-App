import { useState, useCallback, useEffect, useRef } from "react";
import { apiClient } from "../_lib/apiClient";

interface UseInfiniteScrollOptions<T> {
  endpoint: string;
  take?: number;
  params?: Record<string, any>;
  enabled?: boolean;
}

interface InfiniteScrollResponse<T> {
  data: T[];
  meta?: {
    nextCursor: string | null;
  };
}

export function useInfiniteScroll<T>({
  endpoint,
  take = 10,
  params = {},
  enabled = true,
}: UseInfiniteScrollOptions<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const cursorRef = useRef<string | null>(null);

  // Keep cursorRef in sync with cursor state
  useEffect(() => {
    cursorRef.current = cursor;
  }, [cursor]);

  const fetchData = useCallback(async (currentCursor: string | null = null) => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const res = await apiClient.get<T[], { nextCursor: string | null }>(
        endpoint,
        {
          params: {
            take,
            cursor: currentCursor,
            ...params,
          },
        }
      );

      const newItems = res.data || [];
      const nextCursor = res.meta?.nextCursor || null;

      if (currentCursor) {
        setItems((prev) => [...prev, ...newItems]);
      } else {
        setItems(newItems);
      }

      setCursor(nextCursor);
      setHasMore(!!nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch data"));
    } finally {
      setLoading(false);
    }
  }, [endpoint, take, params, enabled]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore && cursorRef.current !== undefined) {
      fetchData(cursorRef.current);
    }
  }, [loading, hasMore, fetchData]);

  const reset = useCallback(() => {
    setItems([]);
    setCursor(null);
    setHasMore(true);
    setError(null);
  }, []);

  const refetch = useCallback(() => {
    fetchData(null);
  }, [fetchData]);

  // Initial fetch on mount
  useEffect(() => {
    if (enabled) {
      fetchData(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return {
    items,
    loading,
    error,
    hasMore,
    loadMore,
    reset,
    refetch,
  };
}

