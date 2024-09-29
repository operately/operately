import * as People from "@/models/people";

export type ItemType = "comment" | "acknowledgement" | "milestone-completed" | "milestone-reopened";

export interface Item {
  type: ItemType;
  insertedAt: Date;
  value: any;
}

export interface FormState {
  items: Item[];
  postComment: (content: string) => void;
  editComment: (commentID: string, content: string) => void;
  submitting: boolean;
  mentionSearchScope: People.SearchScope;
}
