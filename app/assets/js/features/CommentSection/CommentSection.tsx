import React from "react";

import Api, { CommentParentType } from "@/api";
import * as Comments from "@/models/comments";
import * as People from "@/models/people";
import { useMarkNotificationAsRead } from "@/models/notifications";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { compareIds, usePaths } from "@/routes/paths";
import {
  Comment,
  CommentSection as TurboUICommentSection,
  CommentSectionItem,
  Reactions,
  showErrorToast,
} from "turboui";
import * as ReactionsModel from "@/models/reactions";

import { FormState } from "./form";

interface CommentSectionProps {
  form: FormState;
  commentParentType: CommentParentType;
  canComment: boolean;
  ackLabel?: string;
}

export function CommentSection({ form, commentParentType, canComment, ackLabel }: CommentSectionProps) {
  const me = useMe();
  const paths = usePaths();
  const formattedTimePreferences = useFormattedTimePreferences();
  const richTextHandlers = useRichEditorHandlers({ scope: form.mentionSearchScope });
  const [markNotificationAsRead] = useMarkNotificationAsRead();

  const currentUser = People.parsePersonForTurboUi(paths, me);
  const mappedItems = React.useMemo(
    () => mapFormItemsToCommentSectionItems(paths, form.items),
    [paths, form.items],
  );

  const [items, setItems] = React.useState(mappedItems);

  React.useEffect(() => {
    setItems(mappedItems);
  }, [mappedItems]);

  const handleAddReaction = useCommentFeedAddReaction(setItems, commentParentType, paths);
  const handleRemoveReaction = useCommentFeedRemoveReaction(setItems);

  const handleCommentVisible = React.useCallback(
    (commentId: string) => {
      const item = items.find((entry) => entry.type === "comment" && compareIds(entry.value.id, commentId));
      if (!item || item.type !== "comment") return;

      const notification = item.value.notification;
      if (!notification?.id || notification.read) return;

      markNotificationAsRead({ id: notification.id });
    },
    [items, markNotificationAsRead],
  );

  if (!currentUser) return null;

  return (
    <TurboUICommentSection
      items={items}
      currentUser={currentUser}
      canComment={canComment}
      submitting={form.submitting}
      onAddComment={form.postComment}
      onEditComment={form.editComment}
      onDeleteComment={form.deleteComment}
      onAddReaction={handleAddReaction}
      onRemoveReaction={handleRemoveReaction}
      richTextHandlers={richTextHandlers}
      formattedTimePreferences={formattedTimePreferences}
      commentParentType={commentParentType}
      commentDraftKey={form.commentDraftKey}
      editCommentDraftKey={form.editCommentDraftKey}
      ackLabel={ackLabel}
      onCommentVisible={handleCommentVisible}
    />
  );
}

function mapFormItemsToCommentSectionItems(
  paths: ReturnType<typeof usePaths>,
  items: Comments.CommentItem[],
): CommentSectionItem[] {
  return items.map((item) => {
    switch (item.type) {
      case "comment":
        return { type: "comment", value: mapCommentForTurboUi(paths, item.value) };

      case "acknowledgement": {
        const person = People.parsePersonForTurboUi(paths, item.value);
        if (!person) {
          throw new Error("Acknowledgement person is required");
        }

        return {
          type: "acknowledgment",
          value: person,
          insertedAt: toIsoString(item.insertedAt),
        };
      }

      case "milestone-completed":
      case "milestone-reopened": {
        const author = People.parsePersonForTurboUi(paths, item.value.author);
        if (!author) {
          throw new Error("Milestone activity author is required");
        }

        return {
          type: item.type,
          value: {
            id: item.value.id,
            type: item.type,
            author,
            insertedAt: toIsoString(item.value.insertedAt ?? item.insertedAt),
          },
        };
      }

      default:
        throw new Error(`Unknown comment feed item type: ${(item as Comments.CommentItem).type}`);
    }
  });
}

function mapCommentForTurboUi(paths: ReturnType<typeof usePaths>, comment: Comments.Comment): Comment {
  const author = People.parsePersonForTurboUi(paths, comment.author);
  if (!author || !comment.id || !comment.insertedAt) {
    throw new Error("Comment author, id, and insertedAt are required");
  }

  return {
    id: comment.id,
    content: comment.content || "{}",
    author,
    insertedAt: comment.insertedAt,
    reactions: ReactionsModel.parseReactionsForTurboUi(paths, comment.reactions),
    notification: comment.notification,
  };
}

function toIsoString(value: Date | string) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return value;
}

function useCommentFeedAddReaction(
  setItems: React.Dispatch<React.SetStateAction<CommentSectionItem[]>>,
  parentType: CommentParentType,
  paths: ReturnType<typeof usePaths>,
) {
  const me = useMe();
  const [add] = Api.reactions.useCreate();

  return React.useCallback(
    async (commentId: string, emoji: string) => {
      const person = People.parsePersonForTurboUi(paths, me);
      if (!person) return;

      const tempId = `temp-${emoji}-${Date.now()}`;

      setItems((prev) =>
        prev.map((item) => {
          if (item.type !== "comment" || !compareIds(item.value.id, commentId)) return item;

          return {
            ...item,
            value: {
              ...item.value,
              reactions: [...item.value.reactions, { id: tempId, emoji, person }],
            },
          };
        }),
      );

      try {
        const res = await add({
          entityId: commentId,
          entityType: "comment",
          parentType,
          emoji,
        });

        setItems((prev) =>
          prev.map((item) => {
            if (item.type !== "comment" || !compareIds(item.value.id, commentId)) return item;

            return {
              ...item,
              value: {
                ...item.value,
                reactions: item.value.reactions.map((reaction) =>
                  reaction.id === tempId ? { ...reaction, id: res.reaction!.id! } : reaction,
                ),
              },
            };
          }),
        );
      } catch {
        setItems((prev) =>
          prev.map((item) => {
            if (item.type !== "comment" || !compareIds(item.value.id, commentId)) return item;

            return {
              ...item,
              value: {
                ...item.value,
                reactions: item.value.reactions.filter((reaction) => reaction.id !== tempId),
              },
            };
          }),
        );
        showErrorToast("Error", "Failed to add reaction.");
      }
    },
    [add, me, parentType, paths, setItems],
  );
}

function useCommentFeedRemoveReaction(setItems: React.Dispatch<React.SetStateAction<CommentSectionItem[]>>) {
  const [removeReaction] = Api.reactions.useDelete();

  return React.useCallback(
    async (commentId: string, reactionId: string) => {
      let removedReaction: Reactions.Reaction | null = null;

      setItems((prev) =>
        prev.map((item) => {
          if (item.type !== "comment" || !compareIds(item.value.id, commentId)) return item;

          removedReaction = item.value.reactions.find((entry) => entry.id === reactionId) ?? null;

          return {
            ...item,
            value: {
              ...item.value,
              reactions: item.value.reactions.filter((entry) => entry.id !== reactionId),
            },
          };
        }),
      );

      try {
        await removeReaction({ reactionId });
      } catch {
        if (removedReaction) {
          const reactionToRestore = removedReaction;
          setItems((prev) =>
            prev.map((item) => {
              if (item.type !== "comment" || !compareIds(item.value.id, commentId)) return item;

              return {
                ...item,
                value: {
                  ...item.value,
                  reactions: [...item.value.reactions, reactionToRestore],
                },
              };
            }),
          );
        }
        showErrorToast("Error", "Failed to remove reaction.");
      }
    },
    [removeReaction, setItems],
  );
}
