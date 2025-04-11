interface WorkItemPerson {
  id: string;
  fullName: string;
  avatarUrl: string;
}

export interface WorkItem {
  id: string;
  type: "goal" | "project";
  status: "on_track" | "caution" | "concern" | "issue" | "paused" | "outdated" | "pending";
  name: string;
  link: string;
  progress: number;
  subitems: WorkItem[];
  completed: boolean;
  people: WorkItemPerson[];
}

export interface MiniWorkMapProps {
  items: WorkItem[];
}
