import type { ActivityContentProjectRetrospectiveAcknowledged } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler } from "../interfaces";

import { feedTitle, projectLink } from "./../feedItemLinks";
import { Paths } from "@/routes/paths";

const ProjectRetrospectiveAcknowledged: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths: Paths, activity: Activity): string {
    return paths.projectRetrospectivePath(content(activity).project!.id!);
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

    if (page === "project") {
      return feedTitle(activity, "acknowledged the retrospective");
    } else {
      return feedTitle(activity, "acknowledged the retrospective in the", projectLink(project), "project");
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
    return "Acknowledged retrospective";
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).project!.name!;
  },
};

function content(activity: Activity): ActivityContentProjectRetrospectiveAcknowledged {
  return activity.content as ActivityContentProjectRetrospectiveAcknowledged;
}

export default ProjectRetrospectiveAcknowledged;
