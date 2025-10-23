import type { ActivityContentTaskMilestoneUpdating } from "@/api";
import type { Activity } from "@/models/activities";
import { Paths } from "@/routes/paths";
import { feedTitle, milestoneLink, projectLink, taskLink } from "../feedItemLinks";
import type { ActivityHandler } from "../interfaces";
import { compareIds } from "turboui/utils/ids";

const TaskMilestoneUpdating: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths: Paths, activity: Activity) {
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

  FeedItemTitle({ activity, page }: { activity: Activity; page: string }) {
    const { project, task, oldMilestone, newMilestone } = content(activity);

    let message: any[];
    const taskName = task ? taskLink(task) : "task";

    if (!oldMilestone && newMilestone) {
      message = ["assigned", taskName, "to milestone", milestoneLink(newMilestone)];
    } else if (oldMilestone && !newMilestone) {
      message = ["removed", taskName, "from milestone", milestoneLink(oldMilestone)];
    } else if (oldMilestone && newMilestone) {
      if (compareIds(oldMilestone.id, newMilestone.id)) {
        message = ["reordered", taskName, "in the", milestoneLink(oldMilestone), "milestone"];
      } else {
        message = ["moved", taskName, "from milestone", milestoneLink(oldMilestone), "to", milestoneLink(newMilestone)];
      }
    } else {
      message = ["updated", taskName, "milestone"];
    }

    if (page === "project") {
      return feedTitle(activity, ...message);
    } else {
      return feedTitle(activity, ...message, "in", projectLink(project));
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

  NotificationTitle(props: { activity: Activity }) {
    const { oldMilestone, newMilestone } = content(props.activity);

    if (!oldMilestone && newMilestone) {
      return `Task was assigned to milestone "${newMilestone.title}"`;
    } else if (oldMilestone && !newMilestone) {
      return `Task was removed from milestone "${oldMilestone.title}"`;
    } else if (oldMilestone && newMilestone) {
      return `Task was moved from milestone "${oldMilestone.title}" to "${newMilestone.title}"`;
    } else {
      return "Task milestone was updated";
    }
  },

  NotificationLocation(props: { activity: Activity }) {
    return content(props.activity).project!.name!;
  },
};

function content(activity: Activity): ActivityContentTaskMilestoneUpdating {
  return activity.content as ActivityContentTaskMilestoneUpdating;
}

export default TaskMilestoneUpdating;
