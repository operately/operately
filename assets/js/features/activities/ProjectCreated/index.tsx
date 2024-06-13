import * as React from "react";
import * as People from "@/models/people";

import type { Activity } from "@/models/activities";
import type { ActivityContentProjectCreated } from "@/api";
import type { ActivityHandler } from "../interfaces";

import { ProjectLink } from "./../feedItemLinks";

const ProjectCreated: ActivityHandler = {
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
        {People.shortName(activity.author!)} added <ProjectLink project={content(activity).project!} page={page} />
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

function content(activity: Activity): ActivityContentProjectCreated {
  return activity.content as ActivityContentProjectCreated;
}

export default ProjectCreated;
