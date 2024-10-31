import { Activity, ActivityContentCompanyAdminAdded } from "@/api";
import { ActivityHandler } from "../interfaces";
import { feedTitle } from "../feedItemLinks";
import { Paths } from "@/routes/paths";
import { firstName, namesListToString } from "@/models/people";

const CompanyAdminAdded: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(): string {
    return Paths.orgChartPath();
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

  NotificationTitle({ activity }: { activity: Activity }) {
    return firstName(activity.author!) + " granted you admin privileges";
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).company!.name!;
  },
};

export default CompanyAdminAdded;

function content(activity: Activity): ActivityContentCompanyAdminAdded {
  return activity.content as ActivityContentCompanyAdminAdded;
}
