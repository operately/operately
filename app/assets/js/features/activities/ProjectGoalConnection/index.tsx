import * as People from "@/models/people";

import type { ActivityContentProjectGoalConnection } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler } from "../interfaces";


import { feedTitle, goalLink, projectLink } from "../feedItemLinks";

const ProjectGoalConnection: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity): string {
    return paths.projectPath(content(activity).project!.id!);
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
    const project = projectLink(content(activity).project!);
    const goal = goalLink(content(activity).goal!);

    if (page === "project") {
      return feedTitle(activity, "connected the project to the", goal, "goal");
    } else if (page === "goal") {
      return feedTitle(activity, "connected the", project, "project to the goal");
    } else {
      return feedTitle(activity, "connected the", project, "project to the", goal, "goal");
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
    const projectName = content(activity).project!.name!;
    const goalName = content(activity).goal!.name!;

    return People.firstName(activity.author!) + ` connected ${projectName} project to the ${goalName} goal`;
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).project!.name!;
  },
};

function content(activity: Activity): ActivityContentProjectGoalConnection {
  return activity.content as ActivityContentProjectGoalConnection;
}

export default ProjectGoalConnection;
