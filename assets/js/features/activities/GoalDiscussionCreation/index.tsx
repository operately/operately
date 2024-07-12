import React from "react";

import * as People from "@/models/people";
import * as PageOptions from "@/components/PaperContainer/PageOptions";
import * as Icons from "@tabler/icons-react";

import { Activity, ActivityContentGoalDiscussionCreation } from "@/api";
import { isContentEmpty } from "@/components/RichContent/isContentEmpty";
import RichContent, { Summary } from "@/components/RichContent";
import { Paths } from "@/routes/paths";

import { ActivityHandler } from "../interfaces";
import { Link } from "@/components/Link";
import { useMe } from "@/contexts/CurrentUserContext";
import { feedTitle, goalLink } from "./../feedItemLinks";

const GoalDiscussionCreation: ActivityHandler = {
  pageHtmlTitle(activity: Activity) {
    return activity.commentThread!.title as string;
  },

  pagePath(activity: Activity): string {
    return Paths.goalActivityPath(activity.id!);
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
    const me = useMe();

    return (
      <PageOptions.Root testId="options" position="top-right">
        {activity.author!.id! === me?.id && (
          <PageOptions.Link
            icon={Icons.IconEdit}
            title="Edit"
            to={Paths.goalDiscussionEditPath(content(activity).goal!.id!, activity.id!)}
            dataTestId="edit"
          />
        )}
      </PageOptions.Root>
    );
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    return (
      <div>
        {activity.commentThread && !isContentEmpty(activity.commentThread.message) && (
          <Summary jsonContent={activity.commentThread.message} characterCount={300} />
        )}
      </div>
    );
  },

  FeedItemTitle({ activity, page }: { activity: Activity; page: any }) {
    const path = Paths.goalActivityPath(activity.id!);
    const link = <Link to={path}>{activity.commentThread!.title}</Link>;

    if (page === "goal") {
      return feedTitle(activity, "posted ", link);
    } else {
      return feedTitle(activity, "posted ", link, " on the ", goalLink(content(activity).goal!), " goal");
    }
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
