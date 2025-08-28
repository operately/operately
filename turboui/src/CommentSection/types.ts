import { SearchFn } from "../RichEditor/extensions/MentionPeople";
import { MentionedPersonLookupFn } from "../RichEditor";

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

export interface CommentActivity {
  id: string;
  type:
    | "milestone-completed"
    | "milestone-reopened"
    | "milestone-created"
    | "milestone-description-added"
    | "milestone_update"
    | "acknowledgment";
  author: Person;
  insertedAt: string;
  content?: string; // For activities that have descriptive content
}

export type CommentItem =
  | {
      type: "comment";
      value: Comment;
    }
  | {
      type: "milestone-completed" | "milestone-reopened";
      value: CommentActivity;
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

export interface CommentSectionProps {
  form: CommentFormState;
  commentParentType: string;
  canComment: boolean;
}

export interface CommentItemProps {
  comment: Comment;
  form: CommentFormState;
  commentParentType: string;
  canComment: boolean;
  onEdit?: () => void;
  mentionedPersonLookup?: MentionedPersonLookupFn;
  peopleSearch?: SearchFn;
}

export interface CommentInputProps {
  form: CommentFormState;
  onSubmit?: () => void;
  onCancel?: () => void;
  mentionedPersonLookup?: MentionedPersonLookupFn;
  peopleSearch?: SearchFn;
}

export interface ActivityProps {
  activity: CommentActivity;
}

export interface AcknowledgmentProps {
  person: Person;
  ackAt: string;
}
