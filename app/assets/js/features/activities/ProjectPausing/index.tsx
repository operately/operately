import * as React from "react";

import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName, projectLink } from "../feedItemLinks";

import type { ActivityContentProjectPausing } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler, FeedItemProps } from "../interfaces";
import { isContentEmpty, Link, RichContent, Summary } from "turboui";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";

const ProjectPausing: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    return i18n.t("Project paused");
  },

  pagePath(paths, activity: Activity): string {
    if (activity.id) {
      return paths.projectActivityPath(activity.id);
    }

    const projectId = content(activity).project?.id;
    return projectId ? paths.projectPath(projectId) : paths.homePath();
  },

  PageTitle(_props: { activity: any }) {
    return <Trans i18nKey="Project paused" />;
  },

  PageContent({ activity }: { activity: Activity }) {
    const { mentionedPersonLookup } = useRichEditorHandlers();

    return (
      <div>
        {activity.commentThread && !isContentEmpty(activity.commentThread.message) && (
          <RichContent
            taskList={{ canEdit: false }}
            content={activity.commentThread.message}
            mentionedPersonLookup={mentionedPersonLookup}
            parseContent
          />
        )}
      </div>
    );
  },

  PageOptions(_props: { activity: Activity }) {
    return null;
  },

  FeedItemTitle({ activity, page, paths }: FeedItemProps) {
    const activityPath = activity.id ? paths.projectActivityPath(activity.id) : null;
    const link = activityPath ? <Link to={activityPath}>{null}</Link> : <React.Fragment />;
    const project = content(activity).project;

    if (page === "project") {
      return (
        <Trans
          i18nKey="{{author}} <action>paused</action> the project"
          values={{ author: activityAuthorName(activity) }}
          components={{ action: link }}
        />
      );
    } else if (project) {
      return (
        <Trans
          i18nKey="{{author}} <action>paused</action> the <project>{{projectName}}</project> project"
          values={{ author: activityAuthorName(activity), projectName: project.name }}
          components={{ action: link, project: projectLink(paths, project) }}
        />
      );
    } else {
      return (
        <Trans
          i18nKey="{{author}} <action>paused</action> a project"
          values={{ author: activityAuthorName(activity) }}
          components={{ action: link }}
        />
      );
    }
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    const { mentionedPersonLookup } = useRichEditorHandlers();

    return (
      <div>
        {activity.commentThread && !isContentEmpty(activity.commentThread.message) && (
          <Summary
            content={activity.commentThread.message}
            characterCount={300}
            mentionedPersonLookup={mentionedPersonLookup}
          />
        )}
      </div>
    );
  },

  feedItemAlignment(_activity: Activity): "items-start" | "items-center" {
    return "items-center";
  },

  commentCount(activity: Activity): number {
    return activity.commentThread?.commentsCount || 0;
  },

  hasComments(activity: Activity): boolean {
    return !!activity.commentThread;
  },

  NotificationTitle({ activity }: { activity: Activity }) {
    const projectName = content(activity).project?.name;
    return projectName ? i18n.t("Paused the {{projectName}} project", { projectName }) : i18n.t("Paused a project");
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).project?.name || null;
  },
};

function content(activity: Activity): ActivityContentProjectPausing {
  return activity.content as ActivityContentProjectPausing;
}

export default ProjectPausing;
