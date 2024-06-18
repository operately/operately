import * as People from "@/models/people";

import type { Activity } from "@/models/activities";
import type { ActivityContentProjectGoalDisconnection } from "@/api";
import type { ActivityHandler } from "../interfaces";

import { feedTitle, projectLink, goalLink } from "../feedItemLinks";
import { Paths } from "@/routes/paths";

const ProjectGoalDisconnection: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(activity: Activity): string {
    return Paths.projectPath(content(activity).project!.id!);
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
    const goal = goalLink(content(activity).goal!);
    const project = projectLink(content(activity).project!);

    if (page === "project") {
      return feedTitle(activity, "disconnected the project from the", goal, "goal");
    } else if (page === "goal") {
      return feedTitle(activity, "disconnected the", project, "project from the goal");
    } else {
      return feedTitle(activity, "disconnected the", project, "project from the", goal, "goal");
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
    const projectName = content(activity).project!.name!;
    const goalName = content(activity).goal!.name!;

    return People.firstName(activity.author!) + ` disconnected the ${projectName} project to the ${goalName} goal`;
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).project!.name!;
  },
};

function content(activity: Activity): ActivityContentProjectGoalDisconnection {
  return activity.content as ActivityContentProjectGoalDisconnection;
}

export default ProjectGoalDisconnection;
