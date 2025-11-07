import { MilestoneActivity } from "../Timeline/types";
import { RichEditorHandlers } from "../RichEditor/useEditor";
import { Reactions } from "../Reactions";

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
  isSolution?: boolean;
  canMarkAsSolution?: boolean;
  canUnmarkSolution?: boolean;
}

export type CommentItem =
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

export interface CommentFormState {
  items: CommentItem[];
  submitting: boolean;
  mentionSearchScope?: any;
  postComment: (content: any) => void;
  editComment: (id: string, content: any) => void;
  deleteComment?: (id: string) => void;
  markCommentAsSolution?: (id: string) => void | Promise<void>;
  unmarkCommentAsSolution?: (id: string) => void | Promise<void>;
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
  onMarkSolution?: (commentId: string) => void | Promise<void>;
  onUnmarkSolution?: (commentId: string) => void | Promise<void>;
}

export interface CommentInputProps {
  form: CommentFormState;
  onSubmit?: () => void;
  onCancel?: () => void;
  richTextHandlers: RichEditorHandlers;
}
