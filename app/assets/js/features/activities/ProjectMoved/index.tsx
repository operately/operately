import * as React from "react";

import type { ActivityContentProjectMoved } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler, FeedItemProps } from "../interfaces";

import { Link } from "turboui";
import { Trans } from "../i18n";
import i18n from "@/i18n";
import { assertPresent } from "@/utils/assertions";
import { activityAuthorName, projectLink } from "../feedItemLinks";

const ProjectMoved: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity) {
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
    if (page === "project") {
      return <Trans i18nKey="{{author}} moved the project" values={{ author: activityAuthorName(activity) }} />;
    } else {
      const project = content(activity).project;
      assertPresent(project, "Project is required for a moved activity");
      return (
        <Trans
          i18nKey="{{author}} moved the <project>{{projectName}}</project> project"
          values={{ author: activityAuthorName(activity), projectName: project.name }}
          components={{ project: projectLink(paths, project) }}
        />
      );
    }
  },

  FeedItemContent({ activity, paths }: FeedItemProps) {
    const oldSpace = content(activity).oldSpace!;
    const newSpace = content(activity).newSpace!;

    const oldSpacePath = paths.spacePath(oldSpace.id!);
    const newSpacePath = paths.spacePath(newSpace.id!);

    const oldLink = <Link to={oldSpacePath}>{oldSpace.name}</Link>;
    const newLink = <Link to={newSpacePath}>{newSpace.name}</Link>;

    return (
      <Trans
        i18nKey="From <old>{{oldName}}</old> to <new>{{newName}}</new>"
        values={{ oldName: oldSpace.name, newName: newSpace.name }}
        components={{ old: oldLink, new: newLink }}
      />
    );
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
    const oldSpace = content(activity).oldSpace!.name;
    const newSpace = content(activity).newSpace!.name;

    return i18n.t("Moved the project from {{oldSpace}} to {{newSpace}}", { oldSpace, newSpace });
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).project!.name!;
  },
};

function content(activity: Activity): ActivityContentProjectMoved {
  return activity.content as ActivityContentProjectMoved;
}

export default ProjectMoved;
