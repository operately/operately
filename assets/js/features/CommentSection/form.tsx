import { CommentItem } from "@/models/comments";
import * as People from "@/models/people";

export interface FormState {
  items: CommentItem[];
  postComment: (content: string) => void;
  editComment: (commentID: string, content: string) => void;
  submitting: boolean;
  mentionSearchScope: People.SearchScope;
}
