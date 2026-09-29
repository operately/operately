import type { ActivityContentTaskDueDateUpdating } from "@/api";
import type { Activity } from "@/models/activities";
import { Paths } from "@/routes/paths";
import React from "react";
import { DateDisplay } from "turboui";
import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName, projectLink, spaceLink, taskLink } from "../feedItemLinks";
import type { ActivityHandler, FeedItemProps } from "../interfaces";
import { parseContextualDate } from "@/models/contextualDates";
import { hasAggregatedTasks, UpdatedTaskList } from "../taskUpdatedResources";

const TaskDueDateUpdating: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths: Paths, activity: Activity): string {
    const { project, space, task } = content(activity);

    if (project && task) {
      return paths.taskPath(task.id);
    }

    if (project) {
      return paths.projectPath(project.id, { tab: "tasks" });
    }

    if (task) {
      return paths.spaceKanbanPath(space.id, { taskId: task.id });
    }

    return paths.spaceKanbanPath(space.id);
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

  FeedItemTitle(props: FeedItemProps) {
    const { paths } = props;
    const { taskName, task, project, space, newDueDate } = content(props.activity);

    const location = project ? projectLink(paths, project) : spaceLink(paths, space);
    const showLocation = props.page !== "project" && !(props.page === "space" && !project);
    const values = {
      author: activityAuthorName(props.activity),
      taskName: task ? task.name : taskName || i18n.t("a task"),
      locationName: project?.name ?? space.name,
    };

    if (hasAggregatedTasks(props.activity)) {
      const tasks = <UpdatedTaskList activity={props.activity} paths={paths} />;

      return showLocation ? (
        <Trans
          i18nKey="{{author}} updated due dates on <tasks/> in <location>{{locationName}}</location>"
          values={values}
          components={{ tasks, location }}
        />
      ) : (
        <Trans i18nKey="{{author}} updated due dates on <tasks/>" values={values} components={{ tasks }} />
      );
    }

    const taskElement = task ? taskLink(paths, task, { spaceId: !project ? space.id : undefined }) : <React.Fragment />;
    const sentence = showLocation
      ? newDueDate
        ? i18n.t(
            "{{author}} changed the due date to <date/> on <task>{{taskName}}</task> in <location>{{locationName}}</location>",
          )
        : i18n.t(
            "{{author}} cleared the due date on <task>{{taskName}}</task> in <location>{{locationName}}</location>",
          )
      : newDueDate
        ? i18n.t("{{author}} changed the due date to <date/> on <task>{{taskName}}</task>")
        : i18n.t("{{author}} cleared the due date on <task>{{taskName}}</task>");
    return (
      <Trans
        defaults={sentence}
        values={values}
        components={{
          task: taskElement,
          location,
          date: newDueDate ? <DateDisplay date={parseContextualDate(newDueDate)} /> : <React.Fragment />,
        }}
      />
    );
  },

  FeedItemContent(props: { activity: Activity; page: any }) {
    if (hasAggregatedTasks(props.activity)) return null;

    const { oldDueDate } = content(props.activity);

    if (oldDueDate) {
      return (
        <span>
          <Trans
            i18nKey="Previously the due date was <date/>"
            components={{ date: <DateDisplay date={parseContextualDate(oldDueDate)} /> }}
          />
        </span>
      );
    } else {
      return <Trans i18nKey="Previously had no due date" />;
    }
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
    const { task, taskName, newDueDate } = content(props.activity);
    const name = taskName || task?.name || i18n.t("a task");

    if (newDueDate) {
      return (
        <span>
          <Trans
            i18nKey="Updated due date for {{taskName}} to <date/>"
            values={{ taskName: name }}
            components={{ date: <DateDisplay date={parseContextualDate(newDueDate)} /> }}
          />
        </span>
      );
    } else {
      return (
        <span>
          <Trans i18nKey="Cleared due date for {{taskName}}" values={{ taskName: name }} />
        </span>
      );
    }
  },

  NotificationLocation(props: { activity: Activity }) {
    const { project, space } = content(props.activity);

    if (project) {
      return project.name;
    }

    return space.name;
  },
};

function content(activity: Activity): ActivityContentTaskDueDateUpdating {
  return activity.content as ActivityContentTaskDueDateUpdating;
}

export default TaskDueDateUpdating;
