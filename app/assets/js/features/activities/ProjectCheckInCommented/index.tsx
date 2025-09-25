import * as React from "react";

import type { ActivityContentProjectCheckInCommented } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler } from "../interfaces";

import { Summary } from "@/components/RichContent";

import { usePaths } from "@/routes/paths";
import { Link } from "turboui";
import { feedTitle, projectLink } from "./../feedItemLinks";

const ProjectCheckInCommented: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity): string {
    return paths.projectCheckInPath(content(activity).checkIn!.id!);
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
    const project = content(activity).project!;
    const checkIn = content(activity).checkIn!;

    const checkInPath = paths.projectCheckInPath(checkIn.id!);
    const checkInLink = <Link to={checkInPath}>Check-In</Link>;

    if (page === "project") {
      return feedTitle(activity, "commented on ", checkInLink);
    } else {
      return feedTitle(activity, "commented on ", checkInLink, " in the ", projectLink(project), "project");
    }
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    const comment = content(activity).comment!;
    const commentContent = JSON.parse(comment.content!)["message"];

    return <Summary jsonContent={commentContent} characterCount={200} />;
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

  NotificationTitle(_props: { activity: Activity }) {
    return "Re: project check-in";
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).project!.name!;
  },
};

function content(activity: Activity): ActivityContentProjectCheckInCommented {
  return activity.content as ActivityContentProjectCheckInCommented;
}

export default ProjectCheckInCommented;
