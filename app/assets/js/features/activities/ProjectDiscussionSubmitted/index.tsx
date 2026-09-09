import React from "react";

import { Activity, ActivityContentProjectDiscussionSubmitted } from "@/api";
import { isContentEmpty, Link, Summary } from "turboui";
import type { ActivityHandler, FeedItemProps } from "../interfaces";
import { feedTitle, projectLink } from "./../feedItemLinks";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";

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
    const { mentionedPersonLookup } = useRichEditorHandlers();

    return (
      <div>
        {activity.commentThread && !isContentEmpty(activity.commentThread.message) && (
          <Summary
            content={activity.commentThread.message}
            characterCount={300}
            mentionedPersonLookup={mentionedPersonLookup}
          />
        )}
      </div>
    );
  },

  FeedItemTitle({ activity, page, paths }: FeedItemProps) {
    const path = paths.projectDiscussionPath(activity.commentThread!.id!);
    const link = <Link to={path}>{activity.commentThread!.title}</Link>;

    if (page === "project") {
      return feedTitle(activity, "posted ", link);
    } else {
      return feedTitle(
        activity,
        "posted ",
        link,
        " on the ",
        projectLink(paths, content(activity).project!),
        " project",
      );
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
