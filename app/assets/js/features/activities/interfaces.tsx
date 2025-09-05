import type { Activity, AggregatedActivity } from "@/models/activities";
import { Paths } from "@/routes/paths";

export interface ActivityHandler {
  // Feed items
  FeedItemContent(props: { activity: Activity | AggregatedActivity; page: any }): JSX.Element | null;
  FeedItemTitle(props: { activity: Activity | AggregatedActivity; page: any }): JSX.Element | null;
  feedItemAlignment(activity: Activity | AggregatedActivity): "items-start" | "items-center";

  // Activity page
  pagePath(paths: Paths, activity: Activity | AggregatedActivity): string;
  pageHtmlTitle(activity: Activity | AggregatedActivity): string;
  PageTitle(props: { activity: Activity | AggregatedActivity }): JSX.Element;
  PageContent(props: { activity: Activity | AggregatedActivity }): JSX.Element;
  PageOptions(props: { activity: Activity | AggregatedActivity }): JSX.Element | null;

  // Notifications
  NotificationTitle(props: { activity: Activity | AggregatedActivity }): JSX.Element | string;
  NotificationLocation(props: { activity: Activity | AggregatedActivity }): JSX.Element | string | null;

  // Comments
  commentCount(activity: Activity | AggregatedActivity): number;
  hasComments(activity: Activity | AggregatedActivity): boolean;
}
