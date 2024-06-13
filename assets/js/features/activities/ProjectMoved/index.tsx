import * as React from "react";
import * as People from "@/models/people";

import type { Activity } from "@/models/activities";
import type { ActivityContentProjectMoved } from "@/api";
import type { ActivityHandler } from "../interfaces";

import { ProjectLink } from "./../feedItemLinks";
import { Link } from "@/components/Link";
import { Paths } from "@/routes/paths";

const ProjectMoved: ActivityHandler = {
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
    return (
      <>
        {People.shortName(activity.author!)} moved the <ProjectLink project={content(activity).project!} page={page} />
      </>
    );
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    const oldSpace = content(activity).oldSpace!;
    const newSpace = content(activity).newSpace!;

    const oldSpacePath = Paths.spacePath(oldSpace.id!);
    const newSpacePath = Paths.spacePath(newSpace.id!);

    const oldLink = <Link to={oldSpacePath}>{oldSpace.name}</Link>;
    const newLink = <Link to={newSpacePath}>{newSpace.name}</Link>;

    return (
      <>
        From {oldLink} to {newLink}
      </>
    );
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

function content(activity: Activity): ActivityContentProjectMoved {
  return activity.content as ActivityContentProjectMoved;
}

export default ProjectMoved;
