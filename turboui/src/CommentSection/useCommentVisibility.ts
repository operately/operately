import { useCallback, useEffect, useRef } from "react";

/**
 * Returns a ref for a comment element. When that element scrolls into view,
 * calls `onVisible(commentId)` once (e.g. to mark a notification as read).
 */
export function useCommentVisibility(onVisible?: (commentId: string) => void, commentId?: string) {
  const ref = useRef<HTMLDivElement>(null);
  const calledRef = useRef(false);

  const handleVisible = useCallback(() => {
    if (!onVisible || !commentId || calledRef.current) return;
    calledRef.current = true;
    onVisible(commentId);
  }, [onVisible, commentId]);

  useEffect(() => {
    if (!onVisible || !commentId || !ref.current) return;

    const element = ref.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            handleVisible();
            observer.unobserve(entry.target);
          }
        });
      },
      { root: null, threshold: 0.1 },
    );

    const timeoutId = window.setTimeout(() => {
      if (element.isConnected) {
        observer.observe(element);
      }
    }, 500);

    return () => {
      window.clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [onVisible, commentId, handleVisible]);

  return ref;
}
