export type Status =
  | "on_track"
  | "completed"
  | "achieved"
  | "partial"
  | "missed"
  | "paused"
  | "caution"
  | "issue"
  | "dropped"
  | "pending";

interface Person {
  id: string;
  fullName: string;
  avatarUrl?: string;
}

interface DateInfo {
  display: string;
  isPast?: boolean;
}

export type ItemType = "goal" | "project";

export interface WorkMapItem {
  id: string;
  name: string;
  type: ItemType;
  status: Status;
  progress: number;
  deadline?: DateInfo;
  completedOn?: DateInfo;
  space: string;
  owner: Person;
  nextStep: string;
  isNew?: boolean;
  children?: WorkMapItem[];
}

export interface NewItem {
  parentId: string | null;
  name: string;
  type: ItemType;
}
