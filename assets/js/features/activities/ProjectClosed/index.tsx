import * as React from "react";

import type { ActivityContentProjectClosed } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler } from "../interfaces";

import { projectLink, feedTitle } from "../feedItemLinks";
import { Paths } from "@/routes/paths";
import { Link } from "@/components/Link";

const ProjectClosed: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(_activity: Activity): string {
    throw new Error("Not implemented");
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
    const retroId = content(activity).project!.id!;
    const retroPath = Paths.projectRetrospectivePath(retroId!);
    const retroLink = <Link to={retroPath}>retrospective</Link>;
    const project = projectLink(content(activity).project!);

    if (page === "project") {
      return feedTitle(activity, "closed the project and submitted a", retroLink);
    } else {
      return feedTitle(activity, "closed the", project, "project and submitted a", retroLink);
    }
  },

  FeedItemContent(_props: { activity: Activity; page: any }) {
    return null;
  },

  commentCount(_activity: Activity): number {
    throw new Error("Not implemented");
  },

  hasComments(_activity: Activity): boolean {
    throw new Error("Not implemented");
  },

  NotificationTitle(_props: { activity: Activity }) {
    throw new Error("Not implemented");
  },

  CommentNotificationTitle(_props: { activity: Activity }) {
    throw new Error("Not implemented");
  },
};

function content(activity: Activity): ActivityContentProjectClosed {
  return activity.content as ActivityContentProjectClosed;
}

export default ProjectClosed;
