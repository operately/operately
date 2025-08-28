import React from "react";

import * as PageOptions from "@/components/PaperContainer/PageOptions";
import * as People from "@/models/people";

import { Activity, ActivityContentGoalDiscussionCreation } from "@/api";
import RichContent, { Summary } from "@/components/RichContent";

import { useMe } from "@/contexts/CurrentCompanyContext";
import { usePaths } from "@/routes/paths";
import { Link, IconEdit, isContentEmpty } from "turboui";
import { ActivityHandler } from "../interfaces";
import { feedTitle, goalLink } from "./../feedItemLinks";

const GoalDiscussionCreation: ActivityHandler = {
  pageHtmlTitle(activity: Activity) {
    return activity.commentThread!.title as string;
  },

  pagePath(paths, activity: Activity): string {
    return paths.goalActivityPath(activity.id!);
  },

  PageTitle({ activity }: { activity: Activity }) {
    return <>{activity.commentThread!.title}</>;
  },

  PageContent({ activity }: { activity: Activity }) {
    return (
      <div>
        {activity.commentThread && !isContentEmpty(activity.commentThread.message) && (
          <RichContent jsonContent={activity.commentThread!.message!} />
        )}
      </div>
    );
  },

  PageOptions({ activity }: { activity: Activity }) {
    const me = useMe()!;
    const paths = usePaths();

    return (
      <PageOptions.Root testId="options">
        {activity.author!.id! === me?.id && (
          <PageOptions.Link
            icon={IconEdit}
            title="Edit"
            to={paths.goalDiscussionEditPath(activity.id!)}
            testId="edit"
          />
        )}
      </PageOptions.Root>
    );
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
    const path = paths.goalActivityPath(activity.id!);
    const link = <Link to={path}>{activity.commentThread!.title}</Link>;

    if (page === "goal") {
      return feedTitle(activity, "posted ", link);
    } else {
      return feedTitle(activity, "posted ", link, " on the ", goalLink(content(activity).goal!), " goal");
    }
  },

  feedItemAlignment(_activity: Activity): "items-start" | "items-center" {
    return "items-center";
  },

  commentCount(activity: Activity): number {
    return activity.commentThread?.commentsCount || 0;
  },

  hasComments(activity: Activity): boolean {
    return !!activity.commentThread;
  },

  NotificationTitle({ activity }: { activity: Activity }) {
    return People.firstName(activity.author!) + " posted: " + activity.commentThread!.title!;
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).goal!.name!;
  },
};

function content(activity: Activity): ActivityContentGoalDiscussionCreation {
  return activity.content as ActivityContentGoalDiscussionCreation;
}

export default GoalDiscussionCreation;
