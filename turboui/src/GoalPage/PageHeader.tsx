import React from "react";
import { IconBuilding, IconPencil, IconTarget } from "@tabler/icons-react";
import { GoalPage } from ".";
import { PrimaryButton, SecondaryButton } from "../Button";
import { DimmedLink } from "../Link";
import { PrivacyIndicator } from "../PrivacyIndicator";
import { StatusBadge } from "../StatusBadge";

export function PageHeader(props: GoalPage.Props) {
  return (
    <div className="border-b border-stroke-base sm:pt-6 pb-4">
      <ParentGoal {...props} />

      <div className="sm:flex sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold inline">{props.goalName}</h1>

          <PrivacyIndicator
            resourceType="goal"
            privacyLevel={props.privacyLevel}
            spaceName={props.spaceName}
            className="inline-block ml-3 align-[-2px]"
          />

          <StatusBadge status={props.status} hideIcon className="inline-block shrink-0 ml-3 align-[5px]" />
        </div>

        <Buttons {...props} />
      </div>
    </div>
  );
}

function Buttons(props: GoalPage.Props) {
  return (
    <div className="flex items-center gap-2 mt-4 sm:mt-0">
      {props.canEdit && (
        <SecondaryButton size="sm" linkTo={props.editGoalLink}>
          <div className="flex items-center gap-1.5">
            <IconPencil size="16" /> Edit
          </div>
        </SecondaryButton>
      )}
      {props.canEdit && (
        <PrimaryButton size="sm" linkTo={props.newCheckInLink}>
          Check-In
        </PrimaryButton>
      )}
    </div>
  );
}

function ParentGoal(props: GoalPage.Props) {
  if (!props.parentGoal) {
    return <CompanyWideGoal />;
  } else {
    return <ParentGoalLink {...props} />;
  }
}

function CompanyWideGoal() {
  return (
    <div className="flex items-center gap-1.5 text-sm mb-2">
      <IconBuilding size={14} />
      <span>Company-wide goal</span>
    </div>
  );
}

function ParentGoalLink(props: GoalPage.Props) {
  return (
    <div className="flex items-center gap-1.5 text-sm mb-2">
      <IconTarget size={14} className="text-red-500" />
      <DimmedLink to={props.parentGoal!.link} underline="hover">
        {props.parentGoal!.name}
      </DimmedLink>
    </div>
  );
}
