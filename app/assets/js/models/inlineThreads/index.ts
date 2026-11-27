import { useEffect, useState } from "react";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import Api, { type InlineThread, type ResourceHubDocument } from "@/api";
import { queryClient, useLoadedQuery } from "@/api/queryClient";
import { useMe } from "@/contexts/CurrentCompanyContext";

export { useInlineThreadMutations } from "./inlineThreadLifecycle";

export async function prefetchDocumentInlineThreads(document: ResourceHubDocument) {
  if (document.state !== "published") return;

  // Keep failures in the query cache so the comments panel can offer a retry.
  await queryClient
    .fetchQuery({
      ...Api.inline_threads.listQueryOptions({ resourceType: "resource_hub_document", resourceId: document.id }),
      staleTime: 0,
    })
    .catch(() => undefined);
}

interface LinkedMessage {
  threadId: string;
  messageId: string;
}

export function useDocumentInlineThreads(document: ResourceHubDocument, linkedMessage: LinkedMessage | null) {
  const me = useMe();
  const client = useQueryClient();

  const enabled = Boolean(document.state === "published" && me);

  const input = { resourceType: "resource_hub_document" as const, resourceId: document.id };
  const query = useLoadedQuery({ ...Api.inline_threads.listQueryOptions(input), enabled, throwOnError: false });
  const previews = query.isError || !enabled ? [] : (query.data?.threads ?? []);
  const earlierReplies = useEarlierReplies(
    document.id,
    { threads: previews, updatedAt: query.dataUpdatedAt },
    linkedMessage,
  );

  // A separately refreshed thread list may be ahead of the displayed document.
  useEffect(() => {
    if (!enabled || !previews.some((thread) => thread.anchor.currentVersion > (document.currentVersion ?? 0))) return;
    void client.invalidateQueries({ queryKey: Api.documents.getQueryKeyPrefix() });
  }, [enabled, query.data, document.currentVersion, client]);

  const reload = () =>
    Promise.all([client.invalidateQueries({ queryKey: Api.documents.getQueryKeyPrefix() }), query.refetch()]);

  return {
    enabled,
    input,
    loading: query.isPending,
    refreshing: query.fetchStatus !== "idle",
    error: query.isError,
    reload,
    ...earlierReplies,
  };
}

function useEarlierReplies(
  resourceId: string,
  { threads: previews, updatedAt }: { threads: InlineThread[]; updatedAt: number },
  linkedMessage: LinkedMessage | null,
) {
  const [revealed, setRevealed] = useState<{ resourceId: string; threadIds: string[] }>();
  const revealedIds = revealed?.resourceId === resourceId ? revealed.threadIds : [];
  const expanded = previews.filter((thread) => {
    if (thread.earlierReplyCount === 0) return false;
    if (revealedIds.includes(thread.id)) return true;
    // A direct link to an omitted reply needs the full conversation for scrolling.
    return (
      linkedMessage?.threadId === thread.id &&
      !thread.messages.some((message) => message.id === linkedMessage.messageId)
    );
  });
  const queries = useQueries({
    queries: expanded.map(({ id: threadId }) => ({
      ...Api.inline_threads.getQueryOptions({ resourceId, threadId }),
      throwOnError: false,
    })),
  });
  const expandedQueries = new Map(expanded.map(({ id }, i) => [id, queries[i]]));
  const earlierRepliesStatus = new Map<string, "loading" | "error">();
  const threads = previews.map((preview) => {
    const query = expandedQueries.get(preview.id);
    if (!query) return preview;
    if (query.isFetching && (!query.data || query.isError)) earlierRepliesStatus.set(preview.id, "loading");
    else if (query.isError) earlierRepliesStatus.set(preview.id, "error");
    if (!query.data) return preview;

    const { messages } = query.data.thread;
    if (query.isError && updatedAt >= query.dataUpdatedAt) return mergeCachedReplies(preview, messages);
    return { ...preview, messages, earlierReplyCount: 0 };
  });

  const showEarlierReplies = (threadId: string) => {
    setRevealed((previous) => {
      const threadIds = previous?.resourceId === resourceId ? previous.threadIds : [];
      if (threadIds.includes(threadId)) return previous;
      return { resourceId, threadIds: [...threadIds, threadId] };
    });
    void expandedQueries.get(threadId)?.refetch();
  };

  return { threads, earlierRepliesStatus, showEarlierReplies };
}

function mergeCachedReplies(preview: InlineThread, cached: InlineThread["messages"]): InlineThread {
  const [opening, ...recent] = preview.messages;
  if (!opening) return preview;

  const openingIndex = cached.findIndex((message) => message.id === opening.id);
  if (openingIndex < 0) return preview;

  // The preview supplies the current opening and newest replies. Use the cache for the gap.
  const recentIndex = cached.findIndex((message) => recent.some((reply) => reply.id === message.id));
  const earlier = cached.slice(openingIndex + 1, recentIndex < 0 ? undefined : recentIndex);
  if (earlier.length > preview.earlierReplyCount) return preview;

  return {
    ...preview,
    messages: [opening, ...earlier, ...recent],
    earlierReplyCount: preview.earlierReplyCount - earlier.length,
  };
}
