import React from "react";

import Avatar from "@/components/Avatar";
import FormattedTime from "@/components/FormattedTime";
import RichContent from "@/components/RichContent";

import { FilledButton } from "@/components/Button";
import { createPath } from "@/utils/paths";
import { Paths } from "@/routes/paths";
import { ReactionList, useReactionsForm } from "@/features/Reactions";

import * as People from "@/models/people";
import * as Time from "@/utils/time";
import * as Icons from "@tabler/icons-react";
import * as Goals from "@/models/goals";
import * as GoalCheckIns from "@/models/goalCheckIns";
import * as Pages from "@/components/Pages";

export function LastCheckInMessage({ goal }) {
  const { data, loading } = People.useMe({});
  if (loading) return null;

  if (!goal.lastCheckIn) return null;

  const message = goal.lastCheckIn.content.message;
  const path = Paths.goalCheckInPath(goal.id, goal.lastCheckIn.id);

  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-bold uppercase">Last Update Message</div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1 border border-stroke-base p-4 py-3 shadow-sm rounded-lg w-full min-h-[180px]">
          <RichContent jsonContent={message} />
        </div>

        <div className="flex items-center justify-between">
          <LastMessageReactions goal={goal} me={data.me} />
          <div className="flex items-center gap-3">
            <LastMessageComments goal={goal} />

            <FilledButton linkTo={path} size="xs" type="primary">
              Discuss
            </FilledButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function LastMessageComments({ goal }: { goal: Goals.Goal }) {
  if (!goal.lastCheckIn) return null;

  if (goal.lastCheckIn.commentsCount === 0) {
    return <div className="text-sm text-content-dimmed">No comments</div>;
  } else if (goal.lastCheckIn.commentsCount === 1) {
    return <div className="text-sm text-content-dimmed">1 comment</div>;
  } else {
    return <div className="text-sm text-content-dimmed">{goal.lastCheckIn.commentsCount} comments</div>;
  }
}

function LastMessageReactions({ goal, me }: { goal: Goals.Goal; me: People.Person }) {
  const update = goal.lastCheckIn!;
  const reactions = update.reactions!.map((r) => r!);
  const entity = { id: update.id, type: "update" };

  const addReactionForm = useReactionsForm(entity, reactions, me);

  return <ReactionList size={20} form={addReactionForm} />;
}

export function LastCheckInAuthor({ goal }) {
  if (!goal.lastCheckIn) return null;

  const author = goal.lastCheckIn.author;
  const time = goal.lastCheckIn.insertedAt;

  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-bold uppercase">Last Update</div>

      <div className="inline-flex items-center gap-1.5">
        <Avatar person={author} size={20} />
        {People.firstName(author)} updated on <FormattedTime time={time} format="short-date" />
        <Acknowledgement goal={goal} />
      </div>

      <AcknowledgeButton goal={goal} />
    </div>
  );
}

function Acknowledgement({ goal }: { goal: Goals.Goal }) {
  const lastCheckIn = goal.lastCheckIn!;
  if (!lastCheckIn) return null;

  if (lastCheckIn.acknowledged) {
    return (
      <div className="flex items-center gap-1">
        &mdash;
        <Icons.IconCircleCheckFilled size={20} className="text-accent-1" strokeWidth={1.5} />
        Acknowledged by <Avatar person={lastCheckIn.acknowledgingPerson!} size={20} />{" "}
        {People.shortName(lastCheckIn.acknowledgingPerson!)}
      </div>
    );
  } else {
    if (goal.permissions.canAcknowledgeCheckIn) {
      return <> &mdash; You didn't yet acknowledge this update.</>;
    } else {
      return (
        <div className="flex items-center gap-1">
          &mdash; <Avatar person={goal.reviewer!} size={20} /> {People.firstName(goal.reviewer!)} didn't yet acknowledge
          this update
        </div>
      );
    }
  }
}

function AcknowledgeButton({ goal }: { goal: Goals.Goal }) {
  if (!goal.lastCheckIn) return null;
  if (!goal.permissions.canAcknowledgeCheckIn) return null;
  if (goal.lastCheckIn.acknowledged) return null;

  const refresh = Pages.useRefresh();
  const [ack] = GoalCheckIns.useAckUpdate({ onCompleted: refresh });
  const handleAcknowledge = () => ack({ variables: { id: goal.lastCheckIn!.id } });

  return (
    <div className="flex items-center gap-1">
      <FilledButton size="xs" type="primary" onClick={handleAcknowledge}>
        Acknowledge Now
      </FilledButton>
    </div>
  );
}

export function NextCheckInSchedule({ goal }) {
  if (goal.isClosed || goal.isArchived) return null;

  return (
    <div className="flex flex-col gap-4">
      <Icons.IconCalendarRepeat size={30} className="text-content-dimmed" strokeWidth={1.5} />
      <NextCheckInScheduleMessage goal={goal} />
      <CheckInButton goal={goal} />
    </div>
  );
}

function NextCheckInScheduleMessage({ goal }) {
  let scheduledAt = Time.parseDate(goal.nextUpdateScheduledAt);

  if (Time.isPast(scheduledAt!)) {
    return (
      <div className="text-sm mb-2">
        Operately is asking the champion to update the progress at least once per month. It was scheduled for{" "}
        <FormattedTime time={goal.nextUpdateScheduledAt} format="long-date" />.
      </div>
    );
  } else {
    return (
      <div className="text-sm mb-2">
        Operately is asking the champion to update the progress at least once per month. Next update is scheduled for{" "}
        <FormattedTime time={goal.nextUpdateScheduledAt} format="long-date" />.
      </div>
    );
  }
}

function CheckInButton({ goal }) {
  if (!goal.permissions.canCheckIn) return null;
  if (goal.isClosed || goal.isArchived) return null;

  const newCheckInPath = createPath("goals", goal.id, "check-ins", "new");

  return (
    <div className="flex flex-col gap-4">
      <div className="">
        <FilledButton linkTo={newCheckInPath} testId="check-in-now" size="sm" type="primary">
          Update Progress Now
        </FilledButton>
      </div>
    </div>
  );
}
