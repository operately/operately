import type { CommentSectionItem, CommentSectionProps } from "../../CommentSection/types";
import type { SidebarNotificationSection } from "../../SidebarSection";
import type { SpaceKpisPage as KPI } from "../../SpaceKpisPage/types";

export type KpiDemoPerson = KPI.Person & { profileLink: string; title: string };
export type KpiDemoComment = Extract<CommentSectionItem, { type: "comment" }>;
export type KpiDemoActions = Pick<KPI.Props, Extract<keyof KPI.Props, `on${string}`>>;

export interface KpiDemoState {
  kpis: KPI.Kpi[];
  comments: Record<string, KpiDemoComment[]>;
  subscriptions: Record<string, boolean>;
}

export interface KpiDemoFixtures extends KpiDemoState {
  people: KpiDemoPerson[];
  currentUser: KpiDemoPerson;
  space: KPI.Space;
  kpisLink: string;
}

export interface KpiDemoFixtureOptions {
  referenceDate?: Date;
  kpisLink?: string;
  scenario?: "populated" | "empty" | "single-entry";
}

export type KpiDemoMutation =
  | keyof KpiDemoActions
  | "addComment"
  | "editComment"
  | "deleteComment"
  | "addReaction"
  | "removeReaction"
  | "toggleSubscription"
  | "uploadFile";

export interface KpiDemoOptions {
  mutationDelayMs?: number;
  failMutations?: boolean | ((operation: KpiDemoMutation) => boolean);
}

export type KpiDemoCommentProps = Pick<
  CommentSectionProps,
  "currentUser" | "richTextHandlers" | "commentParentType"
> & {
  items: KpiDemoComment[];
  onAddComment: (content: Record<string, unknown>) => Promise<boolean>;
  onEditComment: (id: string, content: Record<string, unknown>) => Promise<boolean>;
  onDeleteComment: (id: string) => Promise<void>;
  onAddReaction: (id: string, emoji: string) => Promise<void>;
  onRemoveReaction: (id: string, reactionId: string) => Promise<void>;
};

export type KpiDemoSubscriptionProps = Omit<SidebarNotificationSection.Props, "onToggle"> & {
  onToggle: (subscribed: boolean) => Promise<void>;
};
