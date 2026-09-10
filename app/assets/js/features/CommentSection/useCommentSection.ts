import { useMemo } from "react";
import Api, { type Comment, type CommentListEntityType, type Person } from "@/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { usePaths, compareIds } from "@/routes/paths";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import * as Comments from "@/models/comments";
import { parsePersonForTurboUi, type SearchScope } from "@/models/people";
import { useReadNotifications } from "@/models/notifications/notificationLifecycle";
import { type CommentQueryInvalidator } from "@/models/comments/commentLifecycle";
import { mapFormItemsToCommentSectionItems } from "./useCommentSectionProps";
import { type CommentSectionProps } from "turboui";

const EMPTY_COMMENTS: Comment[] = [];

interface UseCommentSectionOptions {
  entity: { id: string; type: CommentListEntityType };
  mentionSearchScope: SearchScope;
  invalidateQueries: CommentQueryInvalidator;
  canComment: boolean;
  acknowledgedAt?: string | null;
  acknowledgedBy?: Person | null;
  ackLabel?: string;
}

/**
 * Builds CommentSection props with optimistic comments, reactions, and notification reads.
 * Callers supply the mention scope and invalidate the resource's comments and related cached data.
 */
export function useCommentSection(options: UseCommentSectionOptions): CommentSectionProps | null {
  const { entity, mentionSearchScope, invalidateQueries } = options;
  const client = useQueryClient();
  const paths = usePaths();
  const me = useMe();
  const formattedTimePreferences = useFormattedTimePreferences();
  const richTextHandlers = useRichEditorHandlers({ scope: mentionSearchScope });
  const readNotifications = useReadNotifications((queryClient) => invalidateQueries(queryClient, "none"));
  const query = useQuery(Api.comments.listQueryOptions({ entityId: entity.id, entityType: entity.type }));

  const comments = Comments.useOptimisticComments({
    taskId: entity.id,
    parentType: entity.type,
    initialComments: query.data?.comments ?? EMPTY_COMMENTS,
    invalidateQueries,
  });

  Comments.useReloadCommentsSignal(
    () => {
      void invalidateQueries(client, "active");
    },
    { resourceId: entity.id },
  );

  const items = useMemo(() => {
    let items: Comments.CommentItem[] = comments.comments
      .map((comment) => ({
        type: "comment" as const,
        insertedAt: new Date(comment.insertedAt ?? 0),
        value: comment,
      }))
      .sort((a, b) => a.insertedAt.getTime() - b.insertedAt.getTime());
    if (options.acknowledgedAt && options.acknowledgedBy) {
      items = Comments.insertAcknowledgement(items, options.acknowledgedAt, options.acknowledgedBy);
    }
    return mapFormItemsToCommentSectionItems(paths, items);
  }, [comments.comments, options.acknowledgedAt, options.acknowledgedBy, paths]);

  const currentUser = parsePersonForTurboUi(paths, me);

  if (query.error) throw query.error;
  if (!currentUser) return null;

  return {
    items,
    currentUser,
    submitting: comments.isPending,
    canComment: options.canComment,
    onAddComment: comments.addComment,
    onEditComment: comments.editComment,
    onDeleteComment: comments.deleteComment,
    onAddReaction: comments.addReaction,
    onRemoveReaction: comments.removeReaction,
    richTextHandlers,
    formattedTimePreferences,
    commentParentType: entity.type,
    commentDraftKey: `${entity.type}:${entity.id}:new-comment`,
    editCommentDraftKey: (id) => `${entity.type}:${entity.id}:edit-comment:${id}`,
    ackLabel: options.ackLabel,
    onCommentVisible: async (id) => {
      const notification = comments.comments.find((c) => compareIds(c.id, id))?.notification;
      if (notification) await readNotifications([notification]);
    },
  };
}
