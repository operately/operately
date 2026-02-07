import { Activity, ActivityContentCompanyMembersPermissionsEdited } from "@/api";
import { feedTitle } from "../feedItemLinks";
import { ActivityHandler } from "../interfaces";

const CompanyMembersPermissionsEdited: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths): string {
    return paths.homePath();
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
    const memberCount = content(activity).members?.length ?? 0;
    const memberText = memberCount === 1 ? "member's" : "members'";

    return feedTitle(activity, `has updated ${memberCount} ${memberText} access level`);
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
    const members = content(activity).members ?? [];
    if (members.length === 0) return "Updated your company access level";

    const member = members[0];
    if (!member) return "Updated your company access level";

    return `Updated your company access level to ${member.updatedAccessLevelLabel}`;
  },

  NotificationLocation(_props: { activity: Activity }) {
    return null;
  },
};

export default CompanyMembersPermissionsEdited;

function content(activity: Activity): ActivityContentCompanyMembersPermissionsEdited {
  return activity.content as ActivityContentCompanyMembersPermissionsEdited;
}
