import * as React from "react";
import * as Icons from "@tabler/icons-react";
import * as Goals from "@/models/goals";
import * as Tabs from "@/components/Tabs";
import * as Paper from "@/components/PaperContainer";
import * as PageOptions from "@/components/PaperContainer/PageOptions";
import * as Timeframes from "@/utils/timeframes";

import { GhostLink } from "@/components/Link/GhostList";
import { Paths } from "@/routes/paths";
import { PrimaryButton } from "@/components/Buttons";

import FormattedTime from "@/components/FormattedTime";

import plurarize from "@/utils/plurarize";
import { DimmedLink } from "@/components/Link";

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
// <UpdateProgressButton goal={goal} />

function GoalTitleRow({ goal }: { goal: Goals.Goal }) {
  return (
    <div className="flex items-center gap-4 mt-1">
      <GoalTitle goal={goal} />

      <div className="bg-green-200 rounded-full px-1.5 py-0.5 text-[10px] uppercase font-semibold mt-1">On Track</div>
    </div>
  );
}

function GoalTitle({ goal }: { goal: Goals.Goal }) {
  return <div className="font-bold text-3xl text-content-accent">{goal.name}</div>;
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
        <GhostLink to={Paths.goalsPath()} text="Company-wide goal" testId="company-goals-link" dimmed size="sm" />
      </div>
    );
  }

  return <div className="flex items-center">{content}</div>;
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
    <PageOptions.Root testId="goal-options">
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
    </PageOptions.Root>
  );
}

function Timeframe({ goal }: { goal: Goals.Goal }) {
  const timeframe = Timeframes.parse(goal.timeframe!);

  return (
    <div className="font-medium text-sm mt-1 text-content-dimmed">
      Timeframe: {Timeframes.format(timeframe)} <TimeframeState goal={goal} />
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
