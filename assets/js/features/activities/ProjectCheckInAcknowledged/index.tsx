import * as React from "react";
import * as People from "@/models/people";

import type { ActivityContentProjectCheckInAcknowledged } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler } from "../interfaces";

import { feedTitle, projectLink } from "./../feedItemLinks";
import { Paths } from "@/routes/paths";
import { Link } from "@/components/Link";

const ProjectCheckInAcknowledged: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(activity: Activity): string {
    return Paths.projectCheckInPath(content(activity).checkIn!.id!);
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

  FeedItemTitle({ activity, page }: { activity: Activity; page: any }) {
    const project = content(activity).project!;
    const checkIn = content(activity).checkIn!;

    const checkInPath = Paths.projectCheckInPath(checkIn.id!);
    const checkInLink = <Link to={checkInPath}>Check-In</Link>;

    if (page === "project") {
      return feedTitle(activity, "acknowledged a", checkInLink);
    } else {
      return feedTitle(activity, "acknowledged a", checkInLink, " in the", projectLink(project), "project");
    }
  },

  FeedItemContent(_props: { activity: Activity; page: any }) {
    return null;
  },

  commentCount(_activity: Activity): number {
    throw new Error("Not implemented");
  },

  hasComments(_activity: Activity): boolean {
    throw new Error("Not implemented");
  },

  NotificationTitle({ activity }: { activity: Activity }) {
    return People.firstName(activity.author!) + " acknowledged your check-in";
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).project!.name!;
  },
};

function content(activity: Activity): ActivityContentProjectCheckInAcknowledged {
  return activity.content as ActivityContentProjectCheckInAcknowledged;
}

export default ProjectCheckInAcknowledged;
