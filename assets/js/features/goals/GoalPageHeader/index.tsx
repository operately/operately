import * as React from "react";
import * as Icons from "@tabler/icons-react";
import * as Goals from "@/models/goals";
import * as Paper from "@/components/PaperContainer";
import * as PageOptions from "@/components/PaperContainer/PageOptions";
import * as Timeframes from "@/utils/timeframes";
import * as People from "@/models/people";

import { GhostLink } from "@/components/Link/GhostList";
import { Paths } from "@/routes/paths";
import { PrimaryButton } from "@/components/Buttons";

import FormattedTime from "@/components/FormattedTime";

import plurarize from "@/utils/plurarize";
import { DivLink } from "@/components/Link";
import Avatar from "@/components/Avatar";
import { DimmedLabel } from "@/components/Label";
import { SuccessConditions } from "../SuccessConditions";
import { isContentEmpty } from "@/components/RichContent/isContentEmpty";
import RichContent from "@/components/RichContent";

interface HeaderProps {
  goal: Goals.Goal;
}

export function Header({ goal }: HeaderProps) {
  return (
    <div>
      <Options goal={goal} />
      <Banner goal={goal} />
      <ParentGoal goal={goal.parentGoal} />
      <GoalTitleRow goal={goal} />
    </div>
  );
}

const AvatarAndName = ({ person }) => {
  const profilePath = Paths.profilePath(person.id);

  return (
    <DivLink to={profilePath}>
      <div className="flex items-center gap-1.5 text-sm">
        <Avatar person={person} size="tiny" />
        <div className="" title={person.fullName}>{People.shortName(person)}</div>
      </div>
    </DivLink>
  );
};

function Description({ goal }) {
  return (
    <div className="mt-8">
      <DimmedLabel>Description</DimmedLabel>
      {isContentEmpty(goal.description) ? (
        <div className="text-content-dimmed">No description provided</div>
      ) : (
        <RichContent jsonContent={goal.description} />
      )}
    </div>
  );
}

function GoalTitleRow({ goal }: { goal: Goals.Goal }) {
  return (
    <div className="flex items-start gap-3">
      <GoalIcon />

      <div className="gap-2 mt-1 w-full text-content-accent">
        <div className="flex items-start gap-4 justify-between">
          <GoalTitle goal={goal} />
          <UpdateProgressButton goal={goal} />
        </div>

        <div className="flex item-center mt-4 gap-12">
          <div>
            <DimmedLabel className="mb-1">Timeframe</DimmedLabel>
            <Timeframe goal={goal} />
          </div>

          <div>
            <DimmedLabel className="mb-1">Champion</DimmedLabel>
            <AvatarAndName person={goal.champion} />
          </div>

          <div>
            <DimmedLabel className="mb-1">Reviewer</DimmedLabel>
            <AvatarAndName person={goal.reviewer} />
          </div>
        </div>

        <SuccessConditions goal={goal} />

        <Description goal={goal} />
      </div>
    </div>
  );
}

function GoalTitle({ goal }: { goal: Goals.Goal }) {
  return <div className="font-bold text-2xl text-content-accent flex-1">{goal.name}</div>;
}

function GoalIcon() {
  return (
    <div className="bg-red-500/10 p-1.5 rounded-lg">
      <Icons.IconTarget size={24} className="text-content-error" />
    </div>
  );
}

function ParentGoal({ goal }: { goal: Goals.Goal | null | undefined }) {
  let content: React.ReactNode;

  if (goal) {
    content = (
      <div className="flex items-center gap-1">
        <Icons.IconTarget size={14} className="text-red-500" />
        <GhostLink to={Paths.goalPath(goal.id!)} text={goal.name!} testId="project-goal-link" dimmed size="sm" />
      </div>
    );
  } else {
    content = (
      <div className="flex items-center gap-1">
        <Icons.IconBuildingEstate size={14} />
        <GhostLink to={Paths.goalsPath()} text="This is a company-wide goal" testId="company-goals-link" dimmed size="sm" />
      </div>
    );
  }

  return (
    <div className="flex items-center">
      <div className="border-t-2 border-l-2 border-stroke-base rounded-tl w-7 h-2.5 ml-4 mb-1 mt-2.5 mr-1" />
      {content}
    </div>
  );
}

function Banner({ goal }) {
  if (goal.isClosed) {
    return (
      <Paper.Banner>
        This goal was closed on <FormattedTime time={goal.closedAt} format="long-date" />
      </Paper.Banner>
    );
  }

  if (goal.isArchived) {
    return (
      <Paper.Banner>
        This goal was archived on <FormattedTime time={goal.archivedAt} format="long-date" />
      </Paper.Banner>
    );
  }

  return null;
}

function Options({ goal }) {
  return (
    <PageOptions.Root testId="goal-options" position="top-right">
      {goal.permissions.canEdit && !goal.isClosed && (
        <PageOptions.Link
          icon={Icons.IconEdit}
          title="Edit Goal Definition"
          to={Paths.goalEditPath(goal.id)}
          testId="edit-goal-definition"
        />
      )}

      {goal.permissions.canEdit && !goal.isClosed && (
        <PageOptions.Link
          icon={Icons.IconCalendar}
          title="Edit Timeframe"
          to={Paths.goalEditTimeframePath(goal.id)}
          testId="edit-goal-timeframe"
        />
      )}

      {goal.permissions.canEdit && !goal.isClosed && (
        <PageOptions.Link
          icon={Icons.IconExchange}
          title="Change Parent"
          to={Paths.goalEditParentPath(goal.id)}
          testId="change-parent-goal"
        />
      )}

      {goal.permissions.canClose && !goal.isClosed && (
        <PageOptions.Link
          icon={Icons.IconCircleCheck}
          title="Close Goal"
          to={Paths.goalClosePath(goal.id)}
          testId="close-goal"
        />
      )}

      {goal.permissions.canClose && goal.isClosed && (
        <PageOptions.Link
          icon={Icons.IconRotateDot}
          title="Reopen Goal"
          to={Paths.goalReopenPath(goal.id)}
          testId="reopen-goal"
        />
      )}

      {goal.permissions.canArchive && !goal.isArchived && (
        <PageOptions.Link
          icon={Icons.IconTrash}
          title="Archive"
          to={Paths.goalArchivePath(goal.id)}
          testId="archive-goal"
        />
      )}
    </PageOptions.Root>
  );
}

function Timeframe({ goal }: { goal: Goals.Goal }) {
  const timeframe = Timeframes.parse(goal.timeframe!);

  return (
    <div className="text-sm">
      {Timeframes.format(timeframe)} <TimeframeState goal={goal} />
    </div>
  );
}

function TimeframeState({ goal }) {
  if (goal.isClosed) {
    return (
      <span>
        &middot; Closed on <FormattedTime time={goal.closedAt} format="long-date" />
      </span>
    );
  }

  const timeframe = Timeframes.parse(goal.timeframe);
  if (!Timeframes.isStarted(timeframe)) {
    return (
      <span>
        &middot;{" "}
        <span className="text-accent-1">
          Scheduled to start in {plurarize(Timeframes.startsInDays(timeframe), "day", "days")}
        </span>
      </span>
    );
  }

  if (Timeframes.isOverdue(timeframe)) {
    return (
      <span>
        &middot;{" "}
        <span className="text-content-error">
          Overdue by {plurarize(Timeframes.overdueDays(timeframe), "day", "days")}
        </span>
      </span>
    );
  } else {
    return (
      <span>
        &middot;{" "}
        <span className="text-accent-1">{plurarize(Timeframes.remainingDays(timeframe), "day", "days")} left</span>
      </span>
    );
  }
}

function UpdateProgressButton({ goal }) {
  if (!goal.permissions.canCheckIn) return null;
  if (goal.isClosed || goal.isArchived) return null;

  const path = Paths.goalProgressUpdateNewPath(goal.id);

  return (
    <div className="mt-1">
      <PrimaryButton linkTo={path} testId="update-progress-button" size="sm">
        Update Progress
      </PrimaryButton>
    </div>
  );
}
