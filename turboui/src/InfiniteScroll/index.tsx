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
  const [visibleKey, setVisibleKey] = React.useState<string | null>(null);
  const [failedKey, setFailedKey] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const attemptedKey = React.useRef<string | null>(null);
  const inFlight = React.useRef(false);
  const supportsObserver = typeof IntersectionObserver !== "undefined";
  const failed = props.hasError || failedKey === props.observationKey;

  React.useEffect(() => {
    if (!target || !supportsObserver || !props.hasNextPage) return;

    // Reobserve for each page, including when aggregation reuses the same row.
    setVisibleKey(null);
    const observer = new IntersectionObserver(
      ([entry]) => setVisibleKey(entry?.isIntersecting ? props.observationKey : null),
      { root: null, rootMargin: "0px", threshold: 0 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [target, supportsObserver, props.observationKey, props.hasNextPage]);

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
    if (!target || visibleKey !== props.observationKey || attemptedKey.current === props.observationKey || failed)
      return;
    void loadMore();
  }, [target, visibleKey, props.observationKey, failed, loadMore, pending]);

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
