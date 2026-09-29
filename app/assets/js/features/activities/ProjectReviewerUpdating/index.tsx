import * as People from "@/models/people";
import React from "react";

import type { ActivityContentProjectReviewerUpdating } from "@/api";
import type { Activity } from "@/models/activities";
import { Paths } from "@/routes/paths";
import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName, projectLink } from "../feedItemLinks";
import type { ActivityHandler, FeedItemProps } from "../interfaces";

const ProjectReviewerUpdating: ActivityHandler = {
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
    const project = content(activity).project!;
    const newReviewer = content(activity).newReviewer;
    const sentence =
      page === "project"
        ? newReviewer
          ? i18n.t("{{author}} assigned {{personName}} as the reviewer")
          : i18n.t("{{author}} removed the reviewer")
        : newReviewer
          ? i18n.t("{{author}} assigned {{personName}} as the reviewer on <project>{{projectName}}</project>")
          : i18n.t("{{author}} removed the reviewer on <project>{{projectName}}</project>");
    return (
      <Trans
        defaults={sentence}
        values={{
          author: activityAuthorName(activity),
          personName: newReviewer ? People.shortName(newReviewer) : "",
          projectName: project.name,
        }}
        components={{ project: projectLink(paths, project) }}
      />
    );
  },

  FeedItemContent({ activity }: { activity: Activity; page: any }) {
    const oldReviewer = content(activity).oldReviewer;

    if (oldReviewer) {
      return (
        <Trans
          i18nKey="Previously, {{personName}} was the reviewer."
          values={{ personName: People.shortName(oldReviewer) }}
        />
      );
    } else {
      return <Trans i18nKey="There was no previous reviewer." />;
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
    const { project } = content(props.activity);

    if (!project) {
      return "";
    }

    return i18n.t("{{author}} changed the reviewer for {{projectName}}", {
      author: activityAuthorName(props.activity),
      projectName: project.name,
    });
  },

  NotificationLocation(props: { activity: Activity }) {
    const { project } = content(props.activity);

    if (!project) {
      return "";
    }

    return project.name;
  },
};

function content(activity: Activity): ActivityContentProjectReviewerUpdating {
  return activity.content as ActivityContentProjectReviewerUpdating;
}

export default ProjectReviewerUpdating;
