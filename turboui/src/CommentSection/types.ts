import { MilestoneActivity } from "../Timeline/types";
import { RichEditorHandlers } from "../RichEditor/useEditor";
import { Reactions } from "../Reactions";
import type { AvatarPerson } from "../Avatar";
import type { FormattedTimePreferences } from "../FormattedTime";

export type CommentAppearance = "flat" | "card";

export interface Person {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  profileLink: string;
}

export interface Comment {
  id: string;
  content: string; // JSON string
  author: Person;
  insertedAt: string;
  reactions: Reactions.Reaction[];
  notification?: any; // For notification intersection handling
}

export type CommentSectionItem =
  | {
      type: "comment";
      value: Comment;
    }
  | {
      type: "milestone-completed" | "milestone-reopened";
      value: MilestoneActivity;
    }
  | {
      type: "acknowledgment";
      value: Person;
      insertedAt: string;
    };

/** @deprecated Use CommentSectionItem */
export type CommentItem = CommentSectionItem;

export interface CommentFormState {
  items: CommentSectionItem[];
  submitting: boolean;
  mentionSearchScope?: any;
  postComment: (content: any) => Promise<boolean | void> | boolean | void;
  editComment: (id: string, content: any) => Promise<boolean | void> | boolean | void;
  deleteComment?: (id: string) => Promise<void> | void;
  commentDraftKey?: string;
  editCommentDraftKey?: (id: string) => string | undefined;
}

export interface CommentItemProps {
  comment: Comment;
  form: CommentFormState;
  commentParentType: string;
  canComment: boolean;
  onEdit?: () => void;
  richTextHandlers: RichEditorHandlers;
  currentUserId?: string;
  onAddReaction?: (commentId: string, emoji: string) => void | Promise<void>;
  onRemoveReaction?: (commentId: string, reactionId: string) => void | Promise<void>;
  formattedTimePreferences: FormattedTimePreferences;
  appearance?: CommentAppearance;
  onVisible?: (commentId: string) => void;
}

export interface CommentInputProps {
  form: CommentFormState;
  onSubmit?: () => void;
  onCancel?: () => void;
  richTextHandlers: RichEditorHandlers;
  notificationInfo?: CommentNotificationInfo;
}

export interface CommentNotificationInfo {
  entityLabel: "task" | "milestone";
  subscribedPeople: AvatarPerson[];
  isCurrentUserSubscribed: boolean;
  currentUserId: string;
}

export interface CommentSectionProps {
  items: CommentSectionItem[];
  currentUser: Person;
  canComment: boolean;
  submitting?: boolean;

  onAddComment: (content: any) => Promise<boolean | void> | boolean | void;
  onEditComment: (id: string, content: any) => Promise<boolean | void> | boolean | void;
  onDeleteComment?: (id: string) => Promise<void> | void;
  onAddReaction?: (commentId: string, emoji: string) => void | Promise<void>;
  onRemoveReaction?: (commentId: string, reactionId: string) => void | Promise<void>;

  richTextHandlers: RichEditorHandlers;
  formattedTimePreferences: FormattedTimePreferences;

  commentParentType?: string;
  commentDraftKey?: string;
  editCommentDraftKey?: (id: string) => string | undefined;
  commentNotificationInfo?: CommentNotificationInfo;
  ackLabel?: string;
  onCommentVisible?: (commentId: string) => void;
}
