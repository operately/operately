import React from "react";

import Avatar from "@/components/Avatar";
import FormattedTime from "@/components/FormattedTime";
import RichContent from "@/components/RichContent";

import { FilledButton } from "@/components/Button";
import { createPath } from "@/utils/paths";
import { DivLink } from "@/components/Link";

import * as People from "@/models/people";
import * as Time from "@/utils/time";

export function NextCheckIn({ goal }) {
  if (goal.isClosed || goal.isArchived) return null;

  let copy = "";
  let scheduledAt = Time.parseDate(goal.nextUpdateScheduledAt);

  if (Time.isPast(scheduledAt!)) {
    copy = "Operately is asking the champion to update the progress at least once per month. It was scheduled for ";
  } else {
    copy =
      "Operately is asking the champion to update the progress at least once per month. Next update is scheduled for ";
  }

  return (
    <div className="text-sm mb-2">
      {copy} <FormattedTime time={goal.nextUpdateScheduledAt} format="long-date" />.
    </div>
  );
}

export function LastCheckIn({ goal }) {
  if (!goal.lastCheckIn) return null;

  const message = goal.lastCheckIn.content.message;
  const path = `/goals/${goal.id}/check-ins/${goal.lastCheckIn.id}`;

  return (
    <DivLink className="" to={path}>
      <div className="flex flex-col gap-1 border border-stroke-base p-4 py-3 shadow-sm rounded-lg w-full min-h-[180px]">
        <RichContent jsonContent={message} />
      </div>
    </DivLink>
  );
}

export function LastCheckInAuthor({ goal }) {
  if (!goal.lastCheckIn) return null;

  const author = goal.lastCheckIn.author;
  const time = goal.lastCheckIn.insertedAt;

  return (
    <div className="flex flex-col gap-2 mb-8">
      <div className="flex items-center gap-1.5">
        <Avatar person={author} size={20} />
        {People.firstName(author)} on <FormattedTime time={time} format="short-date" />
      </div>
    </div>
  );
}

export function CheckInButton({ goal }) {
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
