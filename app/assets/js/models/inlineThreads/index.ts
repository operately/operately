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
  const earlierReplies = useEarlierReplies(document.id, previews, linkedMessage);

  // A separately refreshed thread list may be ahead of the displayed document.
  useEffect(() => {
    if (!enabled || !previews.some((thread) => thread.anchor.currentVersion > (document.currentVersion ?? 0))) return;
    void client.invalidateQueries({ queryKey: Api.documents.getQueryKeyPrefix() });
  }, [enabled, query.data, document.currentVersion, client]);

  const reload = () =>
    Promise.all([client.invalidateQueries({ queryKey: Api.documents.getQueryKeyPrefix() }), query.refetch()]);

  return { enabled, input, loading: query.isPending, error: query.isError, reload, ...earlierReplies };
}

function useEarlierReplies(resourceId: string, previews: InlineThread[], linkedMessage: LinkedMessage | null) {
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
    if (query?.data) {
      return { ...preview, messages: query.data.thread.messages, earlierReplyCount: 0 };
    }

    if (query?.isFetching) earlierRepliesStatus.set(preview.id, "loading");
    else if (query?.isError) earlierRepliesStatus.set(preview.id, "error");
    return preview;
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
