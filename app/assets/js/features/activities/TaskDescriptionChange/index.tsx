import * as People from "@/models/people";

import type { ActivityContentTaskDescriptionChange } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler } from "../interfaces";

import { Summary } from "@/components/RichContent";

import { assertPresent } from "@/utils/assertions";
import React from "react";
import { feedTitle, taskLink } from "../feedItemLinks";

const TaskDescriptionChange: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity): string {
    const data = content(activity);
    assertPresent(data.task?.id, "task must be present in activity");

    return paths.taskPath(data.task.id);
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
    const task = data.task ? taskLink(data.task) : "a task";

    if (page === "project") {
      return feedTitle(activity, "updated the description of", task);
    } else {
      return feedTitle(activity, "updated the description of", task, "in", data.projectName);
    }
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    const data = content(activity);

    if (!data.task?.description) return null;
    
    const description = typeof data.task.description === "string" 
      ? JSON.parse(data.task.description) 
      : data.task.description;
    
    return <Summary jsonContent={description} characterCount={200} />;
  },

  feedItemAlignment(_activity: Activity): "items-start" | "items-center" {
    return "items-start";
  },

  commentCount(_activity: Activity): number {
    throw new Error("Not implemented");
  },

  hasComments(_activity: Activity): boolean {
    throw new Error("Not implemented");
  },

  NotificationTitle({ activity }: { activity: Activity }) {
    return "Updated the description of: " + content(activity).task!.name;
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).projectName;
  },
};

function content(activity: Activity): ActivityContentTaskDescriptionChange {
  return activity.content as ActivityContentTaskDescriptionChange;
}

export default TaskDescriptionChange;
