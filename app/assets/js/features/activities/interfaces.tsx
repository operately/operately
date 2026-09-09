import type { Activity } from "@/models/activities";
import { Paths } from "@/routes/paths";

export interface FeedItemProps {
  activity: Activity;
  page: string;
  paths: Paths;
}

export interface ActivityHandler {
  // Feed items
  FeedItemContent(props: FeedItemProps): JSX.Element | null;
  FeedItemTitle(props: FeedItemProps): JSX.Element | null;
  feedItemAlignment(activity: Activity): "items-start" | "items-center";

  // Activity page
  pagePath(paths: Paths, activity: Activity): string;
  pageHtmlTitle(activity: Activity): string;
  PageTitle(props: { activity: Activity }): JSX.Element;
  PageContent(props: { activity: Activity }): JSX.Element;
  PageOptions(props: { activity: Activity }): JSX.Element | null;

  // Notifications
  NotificationTitle(props: { activity: Activity }): JSX.Element | string;
  NotificationLocation(props: { activity: Activity }): JSX.Element | string | null;

  // Comments
  commentCount(activity: Activity): number;
  hasComments(activity: Activity): boolean;
}
