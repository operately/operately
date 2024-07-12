import React from "react";

import Avatar from "@/components/Avatar";
import FormattedTime from "@/components/FormattedTime";
import RichContent from "@/components/RichContent";

import { FilledButton } from "@/components/Button";
import { Paths } from "@/routes/paths";
import { ReactionList, useReactionsForm } from "@/features/Reactions";

import * as People from "@/models/people";
import * as Time from "@/utils/time";
import * as Icons from "@tabler/icons-react";
import * as Goals from "@/models/goals";
import * as GoalCheckIns from "@/models/goalCheckIns";
import * as Pages from "@/components/Pages";

import plurarize from "@/utils/plurarize";
import { DivLink } from "@/components/Link";

export function LastCheckInMessage({ goal }) {
  if (!goal.lastCheckIn) return null;

  const message = goal.lastCheckIn.message;
  const path = Paths.goalProgressUpdatePath(goal.lastCheckIn.id);
  const author = goal.lastCheckIn.author;

  return (
    <div className="flex items-start gap-4">
      <Avatar person={author} size={40} />
      <div className="flex flex-col gap-1 -mt-1">
        <div className="font-semibold">
          Last progress update from <FormattedTime time={goal.lastCheckIn.insertedAt} format="short-date" />
        </div>

        <div className="flex flex-col gap-3 w-full">
          <RichContent jsonContent={message} />

          <div className="flex items-center gap-3">
            <LastMessageReactions goal={goal} />
            <FilledButton linkTo={path} size="xs" type="secondary">
              Discuss
            </FilledButton>

            <LastMessageComments goal={goal} />
          </div>
        </div>
      </div>
    </div>
  );
}

function LastMessageComments({ goal }: { goal: Goals.Goal }) {
  if (!goal.lastCheckIn) return null;

  const path = Paths.goalProgressUpdatePath(goal.lastCheckIn!.id!);

  return (
    <div className="flex items-center gap-1 text-sm leading-none text-content-dimmed">
      <Icons.IconMessage size={14} />{" "}
      <DivLink to={path} className="hover:underline cursor-pointer">
        {plurarize(goal.lastCheckIn!.commentsCount!, "comment", "comments")}
      </DivLink>
    </div>
  );
}

function LastMessageReactions({ goal }: { goal: Goals.Goal }) {
  const update = goal.lastCheckIn!;
  const reactions = update.reactions!.map((r: any) => r!);
  const entity = { id: update.id!, type: "update" };

  const addReactionForm = useReactionsForm(entity, reactions);

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
    if (goal.permissions!.canAcknowledgeCheckIn) {
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
  if (!goal.permissions!.canAcknowledgeCheckIn) return null;
  if (goal.lastCheckIn.acknowledged) return null;

  const refresh = Pages.useRefresh();
  const [ack] = GoalCheckIns.useAcknowledgeGoalProgressUpdate();
  const handleAcknowledge = async () => {
    await ack({ id: goal.lastCheckIn!.id });
    refresh();
  };

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

  const newCheckInPath = Paths.goalProgressUpdateNewPath(goal.id);

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
