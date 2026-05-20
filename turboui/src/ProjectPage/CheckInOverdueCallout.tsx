import React from "react";

import { WarningCallout } from "../Callouts";
import type { ProjectPage } from ".";
import { isCheckInOverdue } from "./checkInOverdue";
import { viewerCanPostCheckIn } from "./checkInPermissions";
import { IconAlertTriangleFilled } from "../icons";

type Props = ProjectPage.State & {
  className?: string;
  variant?: "full" | "compact";
};

export function CheckInOverdueCallout(props: Props) {
  if (!isCheckInOverdue(props.nextCheckInScheduledAt, props.state)) return null;

  const variant = props.variant || "full";
  const championName = props.champion?.fullName;
  const canPost = viewerCanPostCheckIn(props);
  const description = canPost
    ? "Post a check-in to keep the team updated on the project's latest progress."
    : `${championName || "The project champion"} needs to post a check-in to keep the team updated on the project's latest progress.`;

  if (variant === "compact") {
    const compactChampionName = compactPersonName(championName);
    const compactDescription = canPost
      ? "Post the update to keep the team current."
      : `${compactChampionName || "The champion"} needs to post the update.`;

    return (
      <div
        data-test-id="overdue-check-in-callout"
        className={`rounded-md bg-callout-warning-bg p-3 text-sm text-callout-warning-content ${props.className || ""}`}
      >
        <div className="flex items-start gap-2">
          <IconAlertTriangleFilled aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <div className="font-semibold">Check-in overdue</div>
            <div className="mt-1">{compactDescription}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={props.className}>
      <WarningCallout
        testId="overdue-check-in-callout"
        message="Project check-in is overdue"
        description={description}
      />
    </div>
  );
}

function compactPersonName(name: string | undefined) {
  if (!name) return null;

  const parts = name.trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0];
  const lastName = parts[parts.length - 1];

  if (!firstName) return null;
  if (!lastName || lastName === firstName) return firstName;

  return `${firstName} ${lastName[0]}.`;
}
