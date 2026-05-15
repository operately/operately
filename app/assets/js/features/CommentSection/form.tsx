import { CommentItem } from "@/models/comments";
import * as People from "@/models/people";

export interface FormState {
  items: CommentItem[];
  postComment: (content: string) => Promise<boolean | void> | boolean | void;
  editComment: (commentID: string, content: string) => Promise<boolean | void> | boolean | void;
  deleteComment: (commentID: string) => Promise<void>;
  submitting: boolean;
  mentionSearchScope: People.SearchScope;
  commentDraftKey?: string;
  editCommentDraftKey?: (commentID: string) => string;
}
