import type { Activity } from "@/models/activities";

export interface Commentable {
  commentCount(activity: Activity): number;
  hasComments(activity: Activity): boolean;
}

export interface Feedable {
  FeedItemContent(props: { activity: Activity; content: any; page: any }): JSX.Element;
  FeedItemTitle(props: { activity: Activity; content: any; page: any }): JSX.Element;
}

export interface Pageable {
  pagePath(activity: Activity): string;
  pageHtmlTitle(activity: Activity): string;
  PageTitle(props: { activity: Activity }): JSX.Element;
  PageContent(props: { activity: Activity }): JSX.Element;
}
