import React from "react";

import type { ActivityContentProjectDescriptionChanged } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler, FeedItemProps } from "../interfaces";
import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName, projectLink } from "../feedItemLinks";
import { Summary } from "turboui";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";

const ProjectDescriptionChanged: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity) {
    const { project } = content(activity);

    if (project?.id) {
      return paths.projectPath(project.id);
    }

    return paths.homePath();
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
    const { project, projectName, hasDescription } = content(activity);
    const projectDisplay = project ? projectLink(paths, project) : <React.Fragment />;
    const values = { author: activityAuthorName(activity), projectName: project?.name ?? projectName };

    if (page === "project") {
      return hasDescription ? (
        <Trans i18nKey="{{author}} updated the project description" values={values} />
      ) : (
        <Trans i18nKey="{{author}} removed the project description" values={values} />
      );
    }

    if (project) {
      return hasDescription ? (
        <Trans i18nKey="{{author}} updated the <project>{{projectName}}</project> project description" values={values} components={{ project: projectDisplay }} />
      ) : (
        <Trans i18nKey="{{author}} removed the <project>{{projectName}}</project> project description" values={values} components={{ project: projectDisplay }} />
      );
    }

    return hasDescription ? (
      <Trans i18nKey={'{{author}} updated the "{{projectName}}" project description'} values={values} />
    ) : (
      <Trans i18nKey={'{{author}} removed the "{{projectName}}" project description'} values={values} />
    );
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    const data = content(activity);
    const { mentionedPersonLookup } = useRichEditorHandlers();

    const description = decodeDescription(data.description ?? data.project?.description);
    if (!description) return null;

    return <Summary content={description} characterCount={200} mentionedPersonLookup={mentionedPersonLookup} />;
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
    const { project, projectName, hasDescription } = content(activity);
    const name = project?.name ?? projectName;

    return hasDescription
      ? i18n.t('Project "{{projectName}}" description was updated', { projectName: name })
      : i18n.t('Project "{{projectName}}" description was removed', { projectName: name });
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).project?.name ?? content(activity).projectName;
  },
};

function content(activity: Activity): ActivityContentProjectDescriptionChanged {
  return activity.content as ActivityContentProjectDescriptionChanged;
}

function decodeDescription(description?: unknown) {
  if (!description) return null;

  if (typeof description === "string") {
    return safeParseDescription(description);
  }

  if (typeof description === "object") {
    return description;
  }

  return null;
}

function safeParseDescription(description: string) {
  try {
    return JSON.parse(description);
  } catch (_err) {
    return null;
  }
}

export default ProjectDescriptionChanged;
