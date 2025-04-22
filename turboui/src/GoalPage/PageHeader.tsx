import { PrimaryButton, SecondaryButton } from "../Button";
import { IconStar } from "@tabler/icons-react";
import { IconPencil } from "@tabler/icons-react";
import { GoalPage } from ".";
import { IconBuilding } from "@tabler/icons-react";
import { IconTarget } from "@tabler/icons-react";
import { DimmedLink } from "../Link";

export function PageHeader(props: GoalPage.Props) {
  return (
    <div className="border-b border-stroke-base sm:pt-6 pb-4">
      <ParentGoal {...props} />

      <div className="sm:flex sm:items-center justify-between">
        <h1 className="text-3xl font-bold">{props.goalName}</h1>

        <div className="flex items-center gap-2 mt-4 sm:mt-0">
          <SecondaryButton size="sm">
            <div className="flex items-center gap-1.5">
              <IconStar size="16" /> Follow
            </div>
          </SecondaryButton>

          {props.canEdit && (
            <SecondaryButton size="sm">
              <div className="flex items-center gap-1.5">
                <IconPencil size="16" /> Edit
              </div>
            </SecondaryButton>
          )}
          {props.canEdit && <PrimaryButton size="sm">Check-In</PrimaryButton>}
        </div>
      </div>
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
