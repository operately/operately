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
    const data = content(activity);
    const { project: p, goal: g, previousGoal } = data;
    const connectedGoalName = currentGoalName(data);
    const disconnectedGoalName = previousGoalName(data);

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

    if (connectedGoalName) {
      if (page === "project") {
        return feedTitle(activity, "connected the project to the", connectedGoalName, "goal");
      } else {
        return feedTitle(activity, "connected the", project, "project to the", connectedGoalName, "goal");
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
    } else if (disconnectedGoalName) {
      if (page === "project") {
        return feedTitle(activity, "disconnected the project from the", disconnectedGoalName, "goal");
      } else {
        return feedTitle(activity, "disconnected the", project, "project from the", disconnectedGoalName, "goal");
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
    const data = content(activity);
    const projectName = data.project?.name;
    const connectedGoalName = currentGoalName(data);
    const disconnectedGoalName = previousGoalName(data);

    if (connectedGoalName) {
      return projectName
        ? `Connected ${projectName} project to the ${connectedGoalName} goal`
        : `Connected a project to the ${connectedGoalName} goal`;
    }

    if (disconnectedGoalName) {
      return projectName
        ? `Disconnected ${projectName} project from the ${disconnectedGoalName} goal`
        : `Disconnected a project from the ${disconnectedGoalName} goal`;
    }

    return projectName ? `Updated the parent goal of ${projectName} project` : "Updated a project's parent goal";
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    const data = content(activity);

    return data.project?.name ?? currentGoalName(data) ?? previousGoalName(data);
  },
};

function content(activity: Activity): ActivityContentProjectGoalConnection {
  return activity.content as ActivityContentProjectGoalConnection;
}

function currentGoalName(content: ActivityContentProjectGoalConnection): string | null {
  return content.goal?.name ?? content.goalName;
}

function previousGoalName(content: ActivityContentProjectGoalConnection): string | null {
  return content.previousGoal?.name ?? content.previousGoalName;
}

export default ProjectGoalConnection;
