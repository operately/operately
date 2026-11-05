import axios from "axios";
import { useLayoutEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router";
import type { ResourceHubDocument } from "@/api";
import { useDocumentInlineThreads, useInlineThreadMutations } from "@/models/inlineThreads";
import { useCompanyLoaderData } from "@/routes/useCompanyLoaderData";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { usePaths } from "@/routes/paths";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import { showErrorToast, type DocumentInlineCommentsProps } from "turboui";

export function useDocumentInlineComments(document: ResourceHubDocument): DocumentInlineCommentsProps | undefined {
  const { t } = useTranslation();
  const { company } = useCompanyLoaderData();
  const me = useMe();
  const paths = usePaths();
  const location = useLocation();
  const navigate = useNavigate();
  const mutations = useInlineThreadMutations();
  const currentPage = useRef<{ location: typeof location; documentId: string } | null>(null);

  // Track the current page so completed requests cannot navigate after leaving it.
  useLayoutEffect(() => {
    currentPage.current = { location, documentId: document.id };
    return () => {
      currentPage.current = null;
    };
  }, [location, document.id]);

  const richTextHandlers = useRichEditorHandlers({ scope: { type: "resource_hub", id: document.resourceHubId } });
  const formattedTimePreferences = useFormattedTimePreferences();

  const { enabled, input, threads, loading, error, reload } = useDocumentInlineThreads(document);
  const activeThreadId = new URLSearchParams(location.search).get("inlineThread");

  const selectThread = (id: string | null) => {
    // Ignore callbacks captured before navigation or unmount, including a later visit to the same URL.
    if (currentPage.current?.location !== location || currentPage.current.documentId !== document.id) return;

    const search = new URLSearchParams(location.search);
    if (search.get("inlineThread") === id) return;

    if (id) search.set("inlineThread", id);
    else search.delete("inlineThread");
    navigate(
      { pathname: location.pathname, search: search.toString(), hash: location.hash },
      { replace: true, preventScrollReset: true },
    );
  };
  const getThreadLink = (id: string, messageId?: string) => {
    const url = new URL(paths.resourceHubDocumentPath(document.id), window.location.origin);
    url.searchParams.set("inlineThread", id);
    if (messageId) url.hash = messageId;
    return url.toString();
  };

  if (!enabled || !me) return undefined;

  return {
    documentVersion: document.currentVersion ?? 0,
    threads,
    currentUser: { ...me, profileLink: paths.profilePath(me.id) },
    canComment: Boolean(document.currentVersion && document.permissions?.canCommentOnDocument),
    activeThreadId,
    loading,
    error,
    pending: Object.values(mutations).some((mutation) => mutation.isPending),
    draftKey: `inline-comments:${company.id}:${me.id}:${document.id}`,
    richTextHandlers,
    formattedTimePreferences,
    getProfileLink: (personId) => paths.profilePath(personId),
    getThreadLink,
    onSelectThread: selectThread,
    onReload: reload,
    onCreate: async (selection, content) => {
      try {
        const { thread } = await mutations.create.mutateAsync({
          ...input,
          ...selection,
          content: JSON.stringify(content),
        });
        selectThread(thread.id);
        return "ok";
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.data?.details?.reason === "version_conflict") {
          await reload();
          return "conflict";
        }
        showErrorToast(t("Comment not posted"), t("Your draft has been kept for retry."));
        return "error";
      }
    },
    onReply: async (threadId, content) => {
      try {
        await mutations.reply.mutateAsync({ threadId, content: JSON.stringify(content) });
        return true;
      } catch {
        showErrorToast(t("Comment not posted"), t("Your draft has been kept for retry."));
        return false;
      }
    },
    onEditMessage: async (messageId, content) => {
      try {
        await mutations.edit.mutateAsync({ messageId, content: JSON.stringify(content) });
        return true;
      } catch {
        showErrorToast(t("Comment not updated"), t("Your draft has been kept for retry."));
        return false;
      }
    },
    onDeleteMessage: async (messageId) => {
      const { thread } = await mutations.remove.mutateAsync({ messageId });
      if (
        !thread &&
        threads.find((thread) => thread.messages.some((message) => message.id === messageId))?.id === activeThreadId
      )
        selectThread(null);
    },
    onResolve: async (threadId, resolved) => {
      await (resolved ? mutations.resolve : mutations.reopen).mutateAsync({ threadId });
    },
  };
}
