import * as People from "@/models/people";
import * as React from "react";

import type { ActivityContentProjectCheckInAcknowledged } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler } from "../interfaces";

import { usePaths } from "@/routes/paths";
import { Link } from "turboui";
import { feedTitle, projectLink } from "./../feedItemLinks";

const ProjectCheckInAcknowledged: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity): string {
    return paths.projectCheckInPath(content(activity).checkIn!.id!);
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
    const paths = usePaths();
    const project = content(activity).project!;
    const checkIn = content(activity).checkIn!;

    const checkInPath = paths.projectCheckInPath(checkIn.id!);
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
    return "Acknowledged check-in";
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).project!.name!;
  },
};

function content(activity: Activity): ActivityContentProjectCheckInAcknowledged {
  return activity.content as ActivityContentProjectCheckInAcknowledged;
}

export default ProjectCheckInAcknowledged;
