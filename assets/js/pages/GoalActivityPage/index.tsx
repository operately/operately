import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";
import * as People from "@/models/people";
import * as Activities from "@/models/activities";
import * as Timeframes from "@/utils/timeframes";

import { GoalSubpageNavigation } from "@/features/goals/GoalSubpageNavigation";
import { ActivityContentGoalTimeframeEditing } from "@/gql";

import { match } from "ts-pattern";
import { isContentEmpty } from "@/components/RichContent/isContentEmpty";
import { ReactionList, useReactionsForm } from "@/features/Reactions";

import Avatar from "@/components/Avatar";
import FormattedTime from "@/components/FormattedTime";
import RichContent from "@/components/RichContent";

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
  const title = pageTitleContent(activity);

  return (
    <Pages.Page title={[title, goal.name]}>
      <Paper.Root>
        <GoalSubpageNavigation goal={goal} />

        <Paper.Body>
          <Title activity={activity} content={title} />
          <Content activity={activity} />
          <Reactions activity={activity} me={me} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Title({ activity, content }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar person={activity.author} size={50} />
      <div>
        <div className="text-content-accent text-2xl font-bold leading-tight">{content}</div>
        <div className="inline-flex items-center gap-1">
          <span>{activity.author.fullName}</span>
          on <FormattedTime time={activity.insertedAt} format="long-date" />
        </div>
      </div>
    </div>
  );
}

function Content({ activity }: { activity: Activities.Activity }) {
  return match(activity.content.__typename)
    .with("ActivityContentGoalTimeframeEditing", () => <GoalTimeframeEdit activity={activity} />)
    .otherwise(() => {
      throw new Error("Unknown activity type");
    });
}

function GoalTimeframeEdit({ activity }: { activity: Activities.Activity }) {
  const content = activity.content as ActivityContentGoalTimeframeEditing;

  const oldTimeframe = Timeframes.parse(content.oldTimeframe);
  const newTimeframe = Timeframes.parse(content.newTimeframe);

  return (
    <div className="my-8">
      <div className="flex items-center gap-1 font-medium">
        <span className="w-10">New</span>
        <div className="border border-stroke-base rounded-md px-2 py-0.5 bg-base font-medium">
          {Timeframes.format(newTimeframe)}
        </div>
        {Timeframes.dayCount(newTimeframe)} days
      </div>

      <div className="flex items-center gap-1 mt-2 font-medium">
        <span className="w-10">Old</span>
        <div className="border border-stroke-base rounded-md px-2 py-0.5 bg-base font-medium">
          {Timeframes.format(oldTimeframe)}
        </div>
        {Timeframes.dayCount(oldTimeframe)} days
      </div>

      {activity.commentThread && !isContentEmpty(activity.commentThread.message) && (
        <div className="mt-2">
          <RichContent jsonContent={activity.commentThread.message} />
        </div>
      )}
    </div>
  );
}

function pageTitleContent(activity: Activities.Activity): string {
  return match(activity.content.__typename)
    .with("ActivityContentGoalTimeframeEditing", () => "Edited the goal's timeframe")
    .otherwise(() => {
      throw new Error("Unknown activity type");
    });
}

function Reactions({ activity, me }: { activity: Activities.Activity; me: People.Person }) {
  const commentThread = activity.commentThread!;
  const reactions = commentThread.reactions.map((r) => r!);
  const entity = { id: commentThread.id, type: "comment_thread" };
  const addReactionForm = useReactionsForm(entity, reactions, me);

  return <ReactionList size={24} form={addReactionForm} />;
}
