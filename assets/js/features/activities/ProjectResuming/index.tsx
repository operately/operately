import * as React from "react";
import * as People from "@/models/people";

import { Paths } from "@/routes/paths";
import { Link } from "@/components/Link";

import type { Activity } from "@/models/activities";
import type { ActivityContentProjectResuming } from "@/api";
import type { ActivityHandler } from "../interfaces";

const ProjectResuming: ActivityHandler = {
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
    const projectPath = Paths.projectPath(content(activity).project!.id!);

    return (
      <>
        {People.shortName(activity.author!)} resumed the{" "}
        {page === "project" ? (
          "project"
        ) : (
          <>
            <Link to={projectPath}>{content(activity).project!.name!}</Link> project
          </>
        )}
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

function content(activity: Activity): ActivityContentProjectResuming {
  return activity.content as ActivityContentProjectResuming;
}

export default ProjectResuming;
