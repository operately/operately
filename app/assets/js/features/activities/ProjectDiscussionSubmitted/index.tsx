import React from "react";

import * as People from "@/models/people";

import { Activity, ActivityContentProjectDiscussionSubmitted } from "@/api";
import { Summary } from "@/components/RichContent";

import { usePaths } from "@/routes/paths";
import { isContentEmpty, Link } from "turboui";
import { ActivityHandler } from "../interfaces";
import { feedTitle, projectLink } from "./../feedItemLinks";

const ProjectDiscussionSubmitted: ActivityHandler = {
  pageHtmlTitle(activity: Activity) {
    return activity.commentThread!.title as string;
  },

  pagePath(paths, activity: Activity): string {
    return paths.projectDiscussionPath(activity.commentThread!.id!);
  },

  PageTitle({ activity }: { activity: Activity }) {
    return <>{activity.commentThread!.title}</>;
  },

  PageContent(_props: { activity: Activity }) {
    throw "not implemented";
  },

  PageOptions(_props: { activity: Activity }) {
    throw "not implemented";
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    return (
      <div>
        {activity.commentThread && !isContentEmpty(activity.commentThread.message) && (
          <Summary jsonContent={activity.commentThread.message!} characterCount={300} />
        )}
      </div>
    );
  },

  FeedItemTitle({ activity, page }: { activity: Activity; page: any }) {
    const paths = usePaths();
    const path = paths.projectDiscussionPath(activity.commentThread!.id!);
    const link = <Link to={path}>{activity.commentThread!.title}</Link>;

    if (page === "project") {
      return feedTitle(activity, "posted ", link);
    } else {
      return feedTitle(activity, "posted ", link, " on the ", projectLink(content(activity).project!), " project");
    }
  },

  feedItemAlignment(_activity: Activity): "items-start" | "items-center" {
    return "items-start";
  },

  commentCount(activity: Activity): number {
    return activity.commentThread?.commentsCount || 0;
  },

  hasComments(activity: Activity): boolean {
    return !!activity.commentThread;
  },

  NotificationTitle({ activity }: { activity: Activity }) {
    return "Posted: " + activity.commentThread!.title!;
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).project!.name!;
  },
};

function content(activity: Activity): ActivityContentProjectDiscussionSubmitted {
  return activity.content as ActivityContentProjectDiscussionSubmitted;
}

export default ProjectDiscussionSubmitted;
