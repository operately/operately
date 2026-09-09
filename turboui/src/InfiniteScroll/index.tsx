import React from "react";
import { SecondaryButton } from "../Button";
import { ContentListSkeleton } from "../ContentListSkeleton";

export interface InfiniteScrollProps {
  observationKey: string;
  hasNextPage: boolean;
  isFetching: boolean;
  isFetchingNextPage?: boolean;
  hasError?: boolean;
  loadingIndicator?: React.ReactNode;
  onLoadMore: () => Promise<unknown>;
  children: (targetRef: React.RefCallback<HTMLDivElement>) => React.ReactNode;
}

export function InfiniteScroll(props: InfiniteScrollProps) {
  const [target, setTarget] = React.useState<HTMLDivElement | null>(null);
  const [reachedKey, setReachedKey] = React.useState<string | null>(null);
  const [failedKey, setFailedKey] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const attemptedKey = React.useRef<string | null>(null);
  const inFlight = React.useRef(false);
  const supportsObserver = typeof IntersectionObserver !== "undefined";
  const failed = props.hasError || failedKey === props.observationKey;

  const checkPosition = React.useCallback(() => {
    if (!target || !supportsObserver || !props.hasNextPage) return;

    const rect = target.getBoundingClientRect();
    // A fast scroll can skip intersection entirely. Keep loading if the row
    // has already passed above the viewport, ignoring hidden or offscreen columns.
    if (rect.width > 0 && rect.height > 0 && rect.right > 0 && rect.left < window.innerWidth && rect.bottom <= 0) {
      setReachedKey(props.observationKey);
    }
  }, [target, supportsObserver, props.hasNextPage, props.observationKey]);

  React.useEffect(() => {
    if (!target || !supportsObserver || !props.hasNextPage) return;

    let active = true;
    let frame: number | null = null;
    const schedulePositionCheck = () => {
      if (frame !== null) return;
      frame = window.requestAnimationFrame(() => {
        frame = null;
        if (active) checkPosition();
      });
    };

    // Reobserve for each page, including when aggregation reuses the same row.
    const observer = new IntersectionObserver(
      (entries) => {
        if (!active) return;
        // Remember reaching the row even if it leaves while another fetch runs.
        if (entries.some((entry) => entry.isIntersecting)) setReachedKey(props.observationKey);
        checkPosition();
      },
      { root: null, rootMargin: "0px", threshold: 0 },
    );
    observer.observe(target);
    window.addEventListener("scroll", schedulePositionCheck, { capture: true, passive: true });
    window.addEventListener("resize", schedulePositionCheck);
    return () => {
      active = false;
      observer.disconnect();
      window.removeEventListener("scroll", schedulePositionCheck, true);
      window.removeEventListener("resize", schedulePositionCheck);
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, [target, supportsObserver, props.observationKey, props.hasNextPage, checkPosition]);

  React.useEffect(() => {
    checkPosition();
  }, [checkPosition, props.isFetching, pending]);

  const loadMore = React.useCallback(async () => {
    if (!props.hasNextPage || props.isFetching || inFlight.current) return;

    attemptedKey.current = props.observationKey;
    inFlight.current = true;
    setPending(true);
    setFailedKey(null);

    try {
      await props.onLoadMore();
    } catch {
      setFailedKey(props.observationKey);
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }, [props.hasNextPage, props.isFetching, props.observationKey, props.onLoadMore]);

  React.useEffect(() => {
    if (!target || reachedKey !== props.observationKey || attemptedKey.current === props.observationKey || failed)
      return;
    void loadMore();
  }, [target, reachedKey, props.observationKey, failed, loadMore, pending]);

  return (
    <>
      {props.children(setTarget)}
      {(props.isFetchingNextPage || pending) &&
        (props.loadingIndicator ?? (
          <div className="py-4">
            <ContentListSkeleton label="Loading more activities" testId="feed-loading-more" />
          </div>
        ))}
      {failed && (
        <div className="py-4 flex items-center gap-3" data-test-id="feed-pagination-error">
          <span role="alert" className="text-sm text-content-dimmed">
            Couldn’t load more activities.
          </span>
          <SecondaryButton size="xs" onClick={loadMore} disabled={props.isFetching || pending} testId="feed-retry">
            Try again
          </SecondaryButton>
        </div>
      )}
      {!supportsObserver && props.hasNextPage && !failed && (
        <SecondaryButton size="xs" onClick={loadMore} disabled={props.isFetching || pending} testId="feed-load-more">
          Load more
        </SecondaryButton>
      )}
    </>
  );
}
