import * as React from "react";

import type { ActivityContentProjectTaskCommented } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler, FeedItemProps } from "../interfaces";

import { Link, Summary } from "turboui";
import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName, commentPath, commentedLink, projectLink } from "./../feedItemLinks";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { parseCommentContent } from "@/models/comments";

const ProjectTaskCommented: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity): string {
    const { comment, task, project } = content(activity);

    return task ? commentPath(paths.taskPath(task.id), comment) : paths.projectPath(project.id);
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
    const { comment, project, task } = content(activity);

    const taskPath = task ? paths.taskPath(task.id) : null;
    const action = taskPath ? commentedLink(taskPath, comment) : "commented";
    const taskLink = taskPath && task ? <Link to={taskPath}>{null}</Link> : <React.Fragment />;
    const components = {
      action: typeof action === "string" ? <React.Fragment /> : action,
      task: taskLink,
      project: projectLink(paths, project),
    };
    const values = { author: activityAuthorName(activity), taskName: task?.name, projectName: project.name };

    if (page === "project") {
      return task ? (
        <Trans
          i18nKey="{{author}} <action>commented</action> on <task>{{taskName}}</task>"
          values={values}
          components={components}
        />
      ) : (
        <Trans i18nKey="{{author}} commented on a task" values={values} />
      );
    } else {
      return task ? (
        <Trans
          i18nKey="{{author}} <action>commented</action> on <task>{{taskName}}</task> in the <project>{{projectName}}</project> project"
          values={values}
          components={components}
        />
      ) : (
        <Trans
          i18nKey="{{author}} commented on a task in the <project>{{projectName}}</project> project"
          values={values}
          components={components}
        />
      );
    }
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    const { mentionedPersonLookup } = useRichEditorHandlers();
    const { comment } = content(activity);

    if (!comment?.content) {
      return null;
    }

    const commentContent = parseCommentContent(comment.content);

    if (!commentContent) {
      return null;
    }

    return <Summary content={commentContent} characterCount={200} mentionedPersonLookup={mentionedPersonLookup} />;
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
    const { task } = content(activity);
    return task ? i18n.t("Re: {{title}}", { title: task.name }) : i18n.t("Re: a task");
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).project.name;
  },
};

function content(activity: Activity): ActivityContentProjectTaskCommented {
  return activity.content as ActivityContentProjectTaskCommented;
}

export default ProjectTaskCommented;
