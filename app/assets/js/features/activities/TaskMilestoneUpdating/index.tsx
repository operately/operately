import type { ActivityContentTaskMilestoneUpdating } from "@/api";
import type { Activity } from "@/models/activities";
import { Paths } from "@/routes/paths";
import React from "react";
import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName, milestoneLink, projectLink, taskLink } from "../feedItemLinks";
import type { ActivityHandler, FeedItemProps } from "../interfaces";

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

  FeedItemTitle({ activity, page, paths }: FeedItemProps) {
    const { project, task, oldMilestone, newMilestone } = content(activity);

    let sentence: string;
    if (!oldMilestone && newMilestone) {
      sentence =
        page === "project"
          ? i18n.t("{{author}} assigned <task>{{taskName}}</task> to milestone <new>{{newName}}</new>")
          : i18n.t(
              "{{author}} assigned <task>{{taskName}}</task> to milestone <new>{{newName}}</new> in <project>{{projectName}}</project>",
            );
    } else if (oldMilestone && !newMilestone) {
      sentence =
        page === "project"
          ? i18n.t("{{author}} removed <task>{{taskName}}</task> from milestone <old>{{oldName}}</old>")
          : i18n.t(
              "{{author}} removed <task>{{taskName}}</task> from milestone <old>{{oldName}}</old> in <project>{{projectName}}</project>",
            );
    } else if (oldMilestone && newMilestone) {
      sentence =
        page === "project"
          ? i18n.t(
              "{{author}} moved <task>{{taskName}}</task> from milestone <old>{{oldName}}</old> to <new>{{newName}}</new>",
            )
          : i18n.t(
              "{{author}} moved <task>{{taskName}}</task> from milestone <old>{{oldName}}</old> to <new>{{newName}}</new> in <project>{{projectName}}</project>",
            );
    } else {
      sentence =
        page === "project"
          ? i18n.t("{{author}} updated <task>{{taskName}}</task> milestone")
          : i18n.t("{{author}} updated <task>{{taskName}}</task> milestone in <project>{{projectName}}</project>");
    }
    return (
      <Trans
        defaults={sentence}
        values={{
          author: activityAuthorName(activity),
          taskName: task?.name ?? i18n.t("task"),
          oldName: oldMilestone?.title,
          newName: newMilestone?.title,
          projectName: project.name,
        }}
        components={{
          task: task ? taskLink(paths, task) : <React.Fragment />,
          old: oldMilestone ? milestoneLink(paths, oldMilestone) : <React.Fragment />,
          new: newMilestone ? milestoneLink(paths, newMilestone) : <React.Fragment />,
          project: projectLink(paths, project),
        }}
      />
    );
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
      return i18n.t('Task was assigned to milestone "{{title}}"', { title: newMilestone.title });
    } else if (oldMilestone && !newMilestone) {
      return i18n.t('Task was removed from milestone "{{title}}"', { title: oldMilestone.title });
    } else if (oldMilestone && newMilestone) {
      return i18n.t('Task was moved from milestone "{{oldTitle}}" to "{{newTitle}}"', {
        oldTitle: oldMilestone.title,
        newTitle: newMilestone.title,
      });
    } else {
      return i18n.t("Task milestone was updated");
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
