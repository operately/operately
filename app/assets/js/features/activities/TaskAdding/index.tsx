import type { ActivityContentTaskAdding } from "@/api";
import type { Activity } from "@/models/activities";
import { Paths } from "@/routes/paths";
import { feedTitle, projectLink, taskLink } from "../feedItemLinks";
import type { ActivityHandler } from "../interfaces";

const TaskAdding: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths: Paths, activity: Activity) {
    return paths.taskPath(content(activity).task!.id!);
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
    const { project, taskName, task } = content(activity);
    const tName = task ? taskLink(task) : `"${taskName}"`;

    if (page === "project" || page === "task") {
      return feedTitle(activity, "added the task", tName);
    } else {
      return feedTitle(activity, "added the task", tName, "in", projectLink(project));
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
    const { taskName } = content(props.activity);
    return `New task "${taskName}" was created`;
  },

  NotificationLocation(props: { activity: Activity }) {
    return content(props.activity).project!.name!;
  },
};

function content(activity: Activity): ActivityContentTaskAdding {
  return activity.content as ActivityContentTaskAdding;
}

export default TaskAdding;
