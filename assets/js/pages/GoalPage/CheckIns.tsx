import React from "react";

import Avatar from "@/components/Avatar";
import { GhostButton } from "@/components/Button";
import FormattedTime from "@/components/FormattedTime";
import { Summary } from "@/components/RichContent";
import { createPath } from "@/utils/paths";
import { Link } from "@/components/Link";

import * as People from "@/models/people";

export function CheckIns({ goal }) {
  const newCheckInPath = createPath("goals", goal.id, "check-ins", "new");

  const checkInNowLink = (
    <div className="flex">
      <GhostButton linkTo={newCheckInPath} testId="check-in-now" size="xs" type="secondary">
        Check-In Now
      </GhostButton>
    </div>
  );

  if (!goal.lastCheckIn) {
    return (
      <div className="text-sm">
        Asking the champion to check-in every Friday.
        {goal.permissions.canCheckIn && <div className="mt-2">{checkInNowLink}</div>}
      </div>
    );
  }

  const author = goal.lastCheckIn.author;
  const time = goal.lastCheckIn.insertedAt;
  const message = goal.lastCheckIn.content.message;
  const path = `/goals/${goal.id}/check-ins/${goal.lastCheckIn.id}`;

  return (
    <div>
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

      <div className="text-sm font-medium mt-6">Next check-in scheduled for this Friday</div>
      <div className="mt-2">{goal.permissions.canCheckIn && checkInNowLink}</div>
    </div>
  );
}
