import { Activity, ActivityContentCompanyAdminAdded } from "@/api";
import { namesListToString } from "@/models/people";
import { feedTitle } from "../feedItemLinks";
import { ActivityHandler } from "../interfaces";

const CompanyAdminAdded: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths): string {
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
    const names = namesListToString(content(activity).people!);

    return feedTitle(activity, "has granted admin privileges to", names);
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

  NotificationTitle(_props: { activity: Activity }) {
    return "Granted you admin privileges";
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).company!.name!;
  },
};

export default CompanyAdminAdded;

function content(activity: Activity): ActivityContentCompanyAdminAdded {
  return activity.content as ActivityContentCompanyAdminAdded;
}
