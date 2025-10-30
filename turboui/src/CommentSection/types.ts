import { MilestoneActivity } from "../Timeline/types";
import { RichEditorHandlers } from "../RichEditor/useEditor";

export interface Person {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  profileLink: string;
}

export interface Reaction {
  id: string;
  emoji: string;
  count: number;
  reacted: boolean;
}

export interface Comment {
  id: string;
  content: string; // JSON string
  author: Person;
  insertedAt: string;
  reactions: Reaction[];
  notification?: any; // For notification intersection handling
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
}

export interface CommentItemProps {
  comment: Comment;
  form: CommentFormState;
  commentParentType: string;
  canComment: boolean;
  onEdit?: () => void;
  richTextHandlers: RichEditorHandlers;
}

export interface CommentInputProps {
  form: CommentFormState;
  onSubmit?: () => void;
  onCancel?: () => void;
  richTextHandlers: RichEditorHandlers;
}
