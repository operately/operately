import { Activity, ActivityContentCompanyAdminRemoved } from "@/api";
import { firstName } from "@/models/people";
import { feedTitle } from "../feedItemLinks";
import { ActivityHandler } from "../interfaces";

const CompanyAdminRemoved: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, _activity: Activity) {
    return paths.companyAdminPath();
  },

  PageTitle(_props: { activity: any }) {
    throw new Error("Not implemented");
  },

  PageContent(_props: { activity: Activity }) {
    throw new Error("Not implemented");
  },

  PageOptions(_props: { activity: Activity }) {
    return null;
  },

  FeedItemTitle({ activity }: { activity: Activity; page: any }) {
    const name = firstName(content(activity).person!);

    return feedTitle(activity, `has revoked ${name}'s admin privileges`);
  },

  FeedItemContent(_props: { activity: Activity; page: any }) {
    return null;
  },

  feedItemAlignment(_activity: Activity): "items-start" | "items-center" {
    return "items-center";
  },

  commentCount(_activity: Activity): number {
    throw new Error("Not implemented");
  },

  hasComments(_activity: Activity): boolean {
    throw new Error("Not implemented");
  },

  NotificationTitle({ activity }: { activity: Activity }) {
    return "Revoked your admin privileges";
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).company!.name!;
  },
};

export default CompanyAdminRemoved;

function content(activity: Activity): ActivityContentCompanyAdminRemoved {
  return activity.content as ActivityContentCompanyAdminRemoved;
}
