import * as People from "@/models/people";
import * as React from "react";

import type { ActivityContentProjectClosed } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler } from "../interfaces";

import { ProjectLink } from "./../feedItemLinks";
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
    const retroLink = <Link to={Paths.projectRetrospectivePath(content(activity).project!.id!)}>retrospective</Link>;

    return (
      <>
        {People.shortName(activity.author!)} closed <ProjectLink project={content(activity).project!} page={page} /> and
        submitted a {retroLink}
      </>
    );
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
