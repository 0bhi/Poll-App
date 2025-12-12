import { useState, useCallback } from "react";
import { logger } from "../_lib/logger";

interface UseShareOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useShare({ onSuccess, onError }: UseShareOptions = {}) {
  const [isSharing, setIsSharing] = useState(false);

  const share = useCallback(
    async (url: string, title?: string, text?: string) => {
      if (isSharing) return;

      setIsSharing(true);
      try {
        const shareData: ShareData = {
          url,
          ...(title && { title }),
          ...(text && { text }),
        };

        if (navigator?.share) {
          await navigator.share(shareData);
          if (onSuccess) onSuccess();
        } else if (navigator?.clipboard?.writeText) {
          await navigator.clipboard.writeText(url);
          if (onSuccess) onSuccess();
        } else {
          throw new Error("Share API not supported");
        }
      } catch (error) {
        // User cancelled share is not an error
        if (error instanceof Error && error.name !== "AbortError") {
          logger.error("Failed to share", error);
          if (onError) {
            onError(error);
          }
        }
      } finally {
        setIsSharing(false);
      }
    },
    [isSharing, onSuccess, onError]
  );

  const shareUrl = useCallback(
    (path: string, title?: string, text?: string) => {
      const url =
        typeof window !== "undefined"
          ? `${window.location.origin}${path}`
          : path;
      return share(url, title, text);
    },
    [share]
  );

  return {
    share,
    shareUrl,
    isSharing,
  };
}

