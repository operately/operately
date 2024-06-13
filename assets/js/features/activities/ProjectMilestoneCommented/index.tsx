import * as React from "react";
import * as People from "@/models/people";

import type { Activity } from "@/models/activities";
import type { ActivityContentProjectMilestoneCommented } from "@/api";
import type { ActivityHandler } from "../interfaces";

import { Link } from "@/components/Link";
import { Summary } from "@/components/RichContent";
import { ProjectLink } from "../feedItemLinks";

const ProjectMilestoneCommented: ActivityHandler = {
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
    const path = `/projects/${content(activity).projectId!}/milestones/${content(activity).milestone!.id!}`;
    const link = <Link to={path}>{content(activity).milestone!.title!}</Link>;

    return (
      <>
        {People.shortName(activity.author!)} {didWhat(content(activity).commentAction!)}: {link}
        <ProjectLink project={content(activity).project!} page={page} prefix="in" showOnProjectPage={false} />
      </>
    );
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    const comment = content(activity).comment!;
    const commentMessage = JSON.parse(comment.content!)["message"];

    return <Summary jsonContent={commentMessage} characterCount={200} />;
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

function content(activity: Activity): ActivityContentProjectMilestoneCommented {
  return activity.content as ActivityContentProjectMilestoneCommented;
}

export default ProjectMilestoneCommented;

function didWhat(action: string): string {
  switch (action) {
    case "none":
      return "commented on";
    case "complete":
      return "completed";
    case "reopen":
      return "re-opened";
    default:
      throw new Error("Unknown action: " + action);
  }
}
