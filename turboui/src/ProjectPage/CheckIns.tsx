import React from "react";
import { ProjectPage } from ".";
import { PrimaryButton } from "../Button";
import { CheckInCard } from "../CheckInCard";

export function CheckIns(props: ProjectPage.State) {
  const showCheckInButton = props.canEdit && props.state !== "closed";

  return (
    <div className="p-4 max-w-3xl mx-auto my-6 overflow-scroll">
      <div className="flex items-center gap-2 justify-between">
        <div>
          <h2 className="font-bold text-lg">Check-Ins</h2>
          <div className="flex items-center gap-2 text-sm">
            Operately ask the champion to check-in at least once a month.
          </div>
        </div>

        {showCheckInButton && (
          <PrimaryButton linkTo={props.newCheckInLink} size="xs" testId="check-in-button">
            Check-In Now
          </PrimaryButton>
        )}
      </div>

      <div className="mt-8">
        {props.checkIns.map((checkIn) => (
          <CheckInCard key={checkIn.id} checkIn={checkIn} mentionedPersonLookup={props.mentionedPersonLookup} />
        ))}
      </div>
    </div>
  );
}
