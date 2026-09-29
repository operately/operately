import { useLoadedData } from "@/pages/GoalActivityPage/loader";
import { useTaskList } from "@/models/richContent/taskListLifecycle";
import React from "react";

import * as PageOptions from "@/components/PaperContainer/PageOptions";
import { Activity, ActivityContentGoalDiscussionCreation } from "@/api";

import { usePaths } from "@/routes/paths";
import { Link, IconEdit, isContentEmpty, RichContent, Summary } from "turboui";
import type { ActivityHandler, FeedItemProps } from "../interfaces";
import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName, goalLink } from "./../feedItemLinks";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";

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
    const { mentionedPersonLookup } = useRichEditorHandlers();
    const canEdit = useCanEditDiscussion();
    const taskList = useTaskList({
      resourceType: "goal_discussion",
      resourceId: activity.commentThread?.id ?? "",
      field: "message",
      canEdit,
    });

    return (
      <div>
        {activity.commentThread && !isContentEmpty(activity.commentThread.message) && (
          <RichContent
            taskList={taskList}
            content={activity.commentThread!.message!}
            mentionedPersonLookup={mentionedPersonLookup}
            parseContent
          />
        )}
      </div>
    );
  },

  PageOptions({ activity }: { activity: Activity }) {
    const canEdit = useCanEditDiscussion();
    const paths = usePaths();

    return (
      <PageOptions.Root testId="options">
        {canEdit && (
          <PageOptions.Link
            icon={IconEdit}
            title={i18n.t("Edit")}
            to={paths.goalDiscussionEditPath(activity.id!)}
            testId="edit"
            keepOutsideOnBigScreen
          />
        )}
      </PageOptions.Root>
    );
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
    const path = paths.goalActivityPath(activity.id!);
    const link = <Link to={path}>{activity.commentThread!.title}</Link>;

    if (page === "goal") {
      return (
        <Trans
          i18nKey="{{author}} posted <discussion>{{title}}</discussion>"
          values={{ author: activityAuthorName(activity), title: activity.commentThread?.title }}
          components={{ discussion: link }}
        />
      );
    } else {
      const goal = content(activity).goal;
      return (
        <Trans
          i18nKey="{{author}} posted <discussion>{{title}}</discussion> on the <goal>{{goalName}}</goal> goal"
          values={{ author: activityAuthorName(activity), title: activity.commentThread?.title, goalName: goal.name }}
          components={{ discussion: link, goal: goalLink(paths, goal) }}
        />
      );
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
    return i18n.t("Posted: {{title}}", { title: activity.commentThread?.title });
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).goal!.name!;
  },
};

function content(activity: Activity): ActivityContentGoalDiscussionCreation {
  return activity.content as ActivityContentGoalDiscussionCreation;
}

export default GoalDiscussionCreation;

function useCanEditDiscussion(): boolean {
  const { goal } = useLoadedData();
  return goal.permissions?.canEdit ?? false;
}
