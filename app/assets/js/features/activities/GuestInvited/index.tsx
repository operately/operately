import * as People from "@/models/people";
import { feedTitle } from "../feedItemLinks";

import type { ActivityContentGuestInvited } from "@/api";
import type { Activity } from "@/models/activities";

import type { ActivityHandler } from "../interfaces";

const GuestInvited: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, _activity: Activity) {
    return paths.peoplePath();
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
    const guest = content(activity).person;

    if (guest) {
      return feedTitle(activity, "invited", People.firstName(guest), "as a guest");
    } else {
      return feedTitle(activity, "invited a guest");
    }
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
    return "Invited you as a guest";
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).company?.name ?? null;
  },
};

export default GuestInvited;

function content(activity: Activity): ActivityContentGuestInvited {
  return activity.content as ActivityContentGuestInvited;
}
