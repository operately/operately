import * as People from "@/models/people";
import React from "react";

import type { ActivityContentProjectChampionUpdating } from "@/api";
import type { Activity } from "@/models/activities";
import { Paths } from "@/routes/paths";
import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName, projectLink } from "../feedItemLinks";
import type { ActivityHandler, FeedItemProps } from "../interfaces";

const ProjectChampionUpdating: ActivityHandler = {
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
    const newChampion = content(activity).newChampion;
    const values = {
      author: activityAuthorName(activity),
      personName: newChampion ? People.shortName(newChampion) : "",
      projectName: project.name,
    };

    if (page === "project") {
      if (newChampion) {
        return <Trans i18nKey="{{author}} assigned {{personName}} as the champion" values={values} />;
      } else {
        return <Trans i18nKey="{{author}} removed the champion" values={values} />;
      }
    } else {
      const components = { project: projectLink(paths, project) };
      if (newChampion) {
        return <Trans i18nKey="{{author}} assigned {{personName}} as the champion on <project>{{projectName}}</project>" values={values} components={components} />;
      } else {
        return <Trans i18nKey="{{author}} removed the champion on <project>{{projectName}}</project>" values={values} components={components} />;
      }
    }
  },

  FeedItemContent({ activity }: { activity: Activity; page: any }) {
    const oldChampion = content(activity).oldChampion;

    if (oldChampion) {
      return (
        <Trans
          i18nKey="Previously, {{personName}} was the champion."
          values={{ personName: People.shortName(oldChampion) }}
        />
      );
    } else {
      return <Trans i18nKey="There was no previous champion." />;
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

  NotificationTitle({ activity }: { activity: Activity }) {
    const { newChampion, project } = content(activity);

    if (!project) {
      return "";
    }

    if (newChampion) {
      return i18n.t("Changed the champion for {{projectName}}", { projectName: project.name });
    } else {
      return i18n.t("Removed the champion for {{projectName}}", { projectName: project.name });
    }
  },

  NotificationLocation(props: { activity: Activity }) {
    const { project } = content(props.activity);

    if (!project) {
      return "";
    }

    return project.name;
  },
};

function content(activity: Activity): ActivityContentProjectChampionUpdating {
  return activity.content as ActivityContentProjectChampionUpdating;
}

export default ProjectChampionUpdating;
