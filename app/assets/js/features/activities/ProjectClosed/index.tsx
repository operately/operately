import * as React from "react";

import type { ActivityContentProjectClosed } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler } from "../interfaces";

import { usePaths } from "@/routes/paths";
import { Link } from "turboui";
import { feedTitle, projectLink } from "../feedItemLinks";

const ProjectClosed: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity): string {
    return paths.projectRetrospectivePath(content(activity).project!.id!);
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
    const paths = usePaths();
    const retroId = content(activity).project!.id!;
    const retroPath = paths.projectRetrospectivePath(retroId!);
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

  feedItemAlignment(_activity: Activity): "items-start" | "items-center" {
    return "items-center";
  },

  commentCount(_activity: Activity): number {
    throw new Error("Not implemented");
  },

  hasComments(_activity: Activity): boolean {
    throw new Error("Not implemented");
  },

  NotificationTitle(_props: { activity: Activity }) {
    return "Closed this project and submitted a retrospective";
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).project!.name!;
  },
};

function content(activity: Activity): ActivityContentProjectClosed {
  return activity.content as ActivityContentProjectClosed;
}

export default ProjectClosed;
