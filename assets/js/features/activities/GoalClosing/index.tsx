import * as React from "react";
import * as People from "@/models/people";

import * as Icons from "@tabler/icons-react";

import { Activity } from "@/models/activities";
import { ActivityContentGoalClosing } from "@/api";
import RichContent, { Summary } from "@/components/RichContent";
import { Paths } from "@/routes/paths";

import { ActivityHandler } from "../interfaces";
import { isContentEmpty } from "@/components/RichContent/isContentEmpty";
import { feedTitle, goalLink } from "../feedItemLinks";
import { Link } from "@/components/Link";

const GoalClosing: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    return `Goal closed`;
  },

  pagePath(activity: Activity): string {
    return Paths.goalActivityPath(content(activity).goal!.id!, activity.id!);
  },

  PageTitle(_props: { activity: any }) {
    return <>Goal closed</>;
  },

  PageContent({ activity }: { activity: Activity }) {
    return (
      <div>
        <div className="flex items-center gap-3">
          {content(activity).success === "yes" ? <AcomplishedBadge /> : <FailedBadge />}
        </div>

        {activity.commentThread && !isContentEmpty(activity.commentThread.message) && (
          <div className="mt-4">
            <RichContent jsonContent={activity.commentThread!.message!} />
          </div>
        )}
      </div>
    );
  },

  PageOptions(_props: { activity: Activity }) {
    return null;
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    const content = activity.content as ActivityContentGoalClosing;

    return (
      <div>
        <div className="flex items-center gap-3 my-2">
          {content.success === "yes" ? <AcomplishedBadge /> : <FailedBadge />}
        </div>

        {activity.commentThread && !isContentEmpty(activity.commentThread.message) && (
          <div className="mt-2">
            <Summary jsonContent={activity.commentThread.message} characterCount={300} />
          </div>
        )}
      </div>
    );
  },

  FeedItemTitle({ activity, page }: { activity: Activity; content: any; page: any }) {
    const path = Paths.goalActivityPath(content(activity).goal!.id!, activity.id!);
    const link = <Link to={path}>closed</Link>;

    if (page === "goal") {
      return feedTitle(activity, link, "the goal");
    } else {
      return feedTitle(activity, link, "the", goalLink(content(activity).goal!), "goal");
    }
  },

  commentCount(activity: Activity): number {
    return activity.commentThread?.commentsCount || 0;
  },

  hasComments(activity: Activity): boolean {
    return !!activity.commentThread;
  },

  NotificationTitle({ activity }: { activity: Activity }) {
    return People.firstName(activity.author!) + " closed the goal";
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).goal!.name!;
  },
};

export default GoalClosing;

function content(activity: Activity): ActivityContentGoalClosing {
  return activity.content as ActivityContentGoalClosing;
}

function AcomplishedBadge() {
  return (
    <div className="flex items-center gap-1 bg-green-500/20 rounded-xl py-0.5 px-2 pr-3 text-green-800">
      <Icons.IconCheck size={16} />
      <div className="text-sm font-medium">Marked as accomplished</div>
    </div>
  );
}

function FailedBadge() {
  return (
    <div className="flex items-center gap-1 bg-red-500/20 rounded-xl py-0.5 px-2 pr-3 text-red-800">
      <Icons.IconX size={16} />
      <div className="text-sm font-medium">Marked as not accomplished</div>
    </div>
  );
}
