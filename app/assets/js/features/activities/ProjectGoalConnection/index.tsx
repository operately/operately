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
    const { project: p, goal: g, goalName, previousGoal, previousGoalName } = content(activity);

    const project = projectLink(p);

    if (g) {
      const goal = goalLink(g);

      if (page === "project") {
        return feedTitle(activity, "connected the project to the", goal, "goal");
      } else if (page === "goal") {
        return feedTitle(activity, "connected the", project, "project to the goal");
      } else {
        return feedTitle(activity, "connected the", project, "project to the", goal, "goal");
      }
    }

    if (goalName) {
      if (page === "project") {
        return feedTitle(activity, "connected the project to the", goalName, "goal");
      } else {
        return feedTitle(activity, "connected the", project, "project to the", goalName, "goal");
      }
    }

    // Handle cases where a project was disconnected from a goal
    if (previousGoal) {
      const prevGoal = goalLink(previousGoal);

      if (page === "project") {
        return feedTitle(activity, "disconnected the project from the", prevGoal, "goal");
      } else {
        return feedTitle(activity, "disconnected the", project, "project from the", prevGoal, "goal");
      }
    } else if (previousGoalName) {
      if (page === "project") {
        return feedTitle(activity, "disconnected the project from the", previousGoalName, "goal");
      } else {
        return feedTitle(activity, "disconnected the", project, "project from the", previousGoalName, "goal");
      }
    }

    // Fallback if no previous goal information is available
    if (page === "project") {
      return feedTitle(activity, "disconnected the project from its parent goal");
    } else {
      return feedTitle(activity, "disconnected the", project, "project from its parent goal");
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
