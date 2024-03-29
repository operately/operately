import React from "react";

import Avatar from "@/components/Avatar";
import { GhostButton } from "@/components/Button";
import FormattedTime from "@/components/FormattedTime";
import { Summary } from "@/components/RichContent";
import { createPath } from "@/utils/paths";
import { Link } from "@/components/Link";

import * as People from "@/models/people";
import * as Time from "@/utils/time";

export function CheckIns({ goal }) {
  return (
    <div>
      <NextCheckIn goal={goal} />
      <LastCheckIn goal={goal} />
      <CheckInButton goal={goal} />
    </div>
  );
}

function NextCheckIn({ goal }) {
  if (goal.isClosed || goal.isArchived) return null;

  let copy = "";
  let scheduledAt = Time.parseDate(goal.nextUpdateScheduledAt);

  if (Time.isPast(scheduledAt!)) {
    copy = "Asking the champion to check-in monthly. It was scheduled for ";
  } else {
    copy = "Asking the champion to check-in monthly. Next check-in scheduled for ";
  }

  return (
    <div className="text-sm mb-2">
      {copy} <FormattedTime time={goal.nextUpdateScheduledAt} format="long-date" />.
    </div>
  );
}

function LastCheckIn({ goal }) {
  if (!goal.lastCheckIn) return null;

  const author = goal.lastCheckIn.author;
  const time = goal.lastCheckIn.insertedAt;
  const message = goal.lastCheckIn.content.message;
  const path = `/goals/${goal.id}/check-ins/${goal.lastCheckIn.id}`;

  return (
    <div className="flex items-start gap-2 max-w-xl mt-2">
      <div className="flex flex-col gap-1">
        <div className="font-bold flex items-center gap-1">
          <Avatar person={author} size="tiny" />
          {People.shortName(author)} submitted:
          <Link to={path} testId="last-check-in-link">
            Check-in <FormattedTime time={time} format="long-date" />
          </Link>
        </div>
        <Summary jsonContent={message} characterCount={200} />
      </div>
    </div>
  );
}

function CheckInButton({ goal }) {
  if (!goal.permissions.canCheckIn) return null;
  if (goal.isClosed || goal.isArchived) return null;

  const newCheckInPath = createPath("goals", goal.id, "check-ins", "new");

  return (
    <div className="flex mt-2">
      <GhostButton linkTo={newCheckInPath} testId="check-in-now" size="xs" type="secondary">
        Check-In Now
      </GhostButton>
    </div>
  );
}
