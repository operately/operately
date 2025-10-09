import React from "react";

import type { ActivityContentProjectDescriptionChanged } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler } from "../interfaces";
import { feedTitle, projectLink } from "../feedItemLinks";
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

  FeedItemTitle({ activity, page }: { activity: Activity; page: any }) {
    const { project, projectName, hasDescription } = content(activity);
    const projectDisplay = project ? projectLink(project) : `"${projectName}"`;

    if (page === "project") {
      return hasDescription
        ? feedTitle(activity, "updated the project description")
        : feedTitle(activity, "removed the project description");
    }

    return hasDescription
      ? feedTitle(activity, "updated the", projectDisplay, "project description")
      : feedTitle(activity, "removed the", projectDisplay, "project description");
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    const data = content(activity);
    const { mentionedPersonLookup } = useRichEditorHandlers();

    const rawDescription = data.description ?? data.project?.description;
    if (!rawDescription) return null;

    const description = typeof rawDescription === "string" ? safeParseDescription(rawDescription) : rawDescription;
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
      ? `Updated the "${name}" project description`
      : `Removed the "${name}" project description`;
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).project?.name ?? content(activity).projectName;
  },
};

function content(activity: Activity): ActivityContentProjectDescriptionChanged {
  return activity.content as ActivityContentProjectDescriptionChanged;
}

function safeParseDescription(description: string) {
  try {
    return JSON.parse(description);
  } catch (_err) {
    return null;
  }
}

export default ProjectDescriptionChanged;
