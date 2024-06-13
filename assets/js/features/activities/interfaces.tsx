import type { Activity } from "@/models/activities";

export interface ActivityHandler {
  // Feed items
  FeedItemContent(props: { activity: Activity; page: any }): JSX.Element | null;
  FeedItemTitle(props: { activity: Activity; page: any }): JSX.Element | null;

  // Activity page
  pagePath(activity: Activity): string;
  pageHtmlTitle(activity: Activity): string;
  PageTitle(props: { activity: Activity }): JSX.Element;
  PageContent(props: { activity: Activity }): JSX.Element;
  PageOptions(props: { activity: Activity }): JSX.Element | null;

  // Notifications
  NotificationTitle(props: { activity: Activity }): JSX.Element;
  CommentNotificationTitle(props: { activity: Activity }): JSX.Element;

  // Comments
  commentCount(activity: Activity): number;
  hasComments(activity: Activity): boolean;
}
