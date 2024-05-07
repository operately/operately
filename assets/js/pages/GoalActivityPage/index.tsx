import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";
import * as People from "@/models/people";
import * as Activities from "@/models/activities";
import * as GoalTimeframeEditing from "@/features/activities/GoalTimeframeEditing";

import { match } from "ts-pattern";

import { GoalSubpageNavigation } from "@/features/goals/GoalSubpageNavigation";
import { CommentThread } from "@/gql";
import { ReactionList, useReactionsForm } from "@/features/Reactions";
import { CommentSection, useForCommentThread } from "@/features/CommentSection";

import Avatar from "@/components/Avatar";
import FormattedTime from "@/components/FormattedTime";

interface LoaderResult {
  goal: Goals.Goal;
  activity: Activities.Activity;
  me: People.Person;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    goal: await Goals.getGoal({ id: params.goalId }),
    activity: await Activities.getActivity({ id: params.id }),
    me: await People.getMe({}),
  };
}

export function Page() {
  const { goal, activity, me } = Pages.useLoadedData<LoaderResult>();
  const title = GoalTimeframeEditing.htmlTitle();

  return (
    <Pages.Page title={[title, goal.name]}>
      <Paper.Root>
        <GoalSubpageNavigation goal={goal} />

        <Paper.Body>
          <Title activity={activity} />
          <div className="my-8">
            <Content activity={activity} />
          </div>

          <Reactions commentThread={activity.commentThread!} me={me} />
          <div className="border-t border-stroke-base mt-8" />
          <Comments commentThread={activity.commentThread!} me={me} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Content({ activity }: { activity: Activities.Activity }) {
  return match(activity.content.__typename)
    .with("ActivityContentGoalTimeframeEditing", () => <GoalTimeframeEditing.Content activity={activity} />)
    .otherwise(() => {
      throw new Error("Unknown activity type");
    });
}

function Title({ activity }: { activity: Activities.Activity }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar person={activity.author} size={50} />
      <div>
        <div className="text-content-accent text-2xl font-bold leading-tight">
          <GoalTimeframeEditing.Title activity={activity} />
        </div>
        <div className="inline-flex items-center gap-1">
          <span>{activity.author.fullName}</span>
          on <FormattedTime time={activity.insertedAt} format="long-date" />
        </div>
      </div>
    </div>
  );
}

function Reactions({ commentThread, me }: { commentThread: CommentThread; me: People.Person }) {
  const reactions = commentThread.reactions.map((r) => r!);
  const entity = { id: commentThread.id, type: "comment_thread" };
  const addReactionForm = useReactionsForm(entity, reactions, me);

  return <ReactionList size={24} form={addReactionForm} />;
}

function Comments({ commentThread, me }: { commentThread: CommentThread; me: People.Person }) {
  const refresh = Pages.useRefresh();
  const commentsForm = useForCommentThread(commentThread);

  return <CommentSection form={commentsForm} me={me} refresh={refresh} />;
}
