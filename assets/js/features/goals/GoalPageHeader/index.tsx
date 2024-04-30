import * as React from "react";
import * as Icons from "@tabler/icons-react";
import * as Goals from "@/models/goals";
import * as Tabs from "@/components/Tabs";
import * as Paper from "@/components/PaperContainer";
import * as PageOptions from "@/components/PaperContainer/PageOptions";
import * as Timeframes from "@/utils/timeframes";

import { GhostLink } from "@/components/Link/GhostList";
import { Paths } from "@/routes/paths";

import FormattedTime from "@/components/FormattedTime";

import classnames from "classnames";
import plurarize from "@/utils/plurarize";

interface HeaderProps {
  activeTab: "status" | "subgoals" | "discussions" | "about";
  goal: Goals.Goal;
}

export function Header({ goal, activeTab }: HeaderProps) {
  return (
    <div>
      <Options goal={goal} />
      <Banner goal={goal} />

      <div className="flex-1">
        <ParentGoal goal={goal.parentGoal} />

        <div className={classnames("flex gap-3 items-start", "text-content-accent")}>
          <div className="bg-red-500/10 p-1.5 rounded-lg">
            <Icons.IconTarget size={24} className="text-red-500" />
          </div>

          <div className="gap-2 mt-1">
            <div className="font-bold text-2xl text-content-accent flex-1">{goal.name}</div>
            <Timeframe goal={goal} />
          </div>
        </div>

        <Tabs.Root activeTab={activeTab}>
          <Tabs.Tab id="status" title="Current Status" linkTo={Paths.goalPath(goal.id)} />
          <Tabs.Tab id="subgoals" title="Sub-Goals and Projects" linkTo={Paths.goalSubgoalsPath(goal.id)} />
          <Tabs.Tab id="discussions" title="Discussions" linkTo={Paths.goalDiscussionsPath(goal.id)} />
          <Tabs.Tab id="about" title="About" linkTo={Paths.goalAboutPath(goal.id)} />
        </Tabs.Root>
      </div>
    </div>
  );
}

function ParentGoal({ goal }: { goal: Goals.Goal | null | undefined }) {
  let content: React.ReactNode;

  if (goal) {
    content = (
      <div className="flex items-center gap-1">
        <Icons.IconTarget size={14} className="text-red-500" />
        <GhostLink to={Paths.goalPath(goal.id)} text={goal.name} testID="project-goal-link" dimmed size="sm" />
      </div>
    );
  } else {
    content = (
      <div className="flex items-center gap-1">
        <Icons.IconBuildingEstate size={14} />
        <GhostLink to={Paths.goalsPath()} text="Company-wide goal" testID="company-goals-link" dimmed size="sm" />
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
        This goal was completed on <FormattedTime time={goal.closedAt} format="long-date" />
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
          title="Edit Goal"
          to={Paths.editGoalPath(goal.id)}
          dataTestId="edit-goal"
        />
      )}

      {goal.permissions.canEdit && !goal.isClosed && (
        <PageOptions.Link
          icon={Icons.IconExchange}
          title="Change Parent"
          to={Paths.editGoalParentPath(goal.id)}
          dataTestId="change-parent-goal"
        />
      )}

      {goal.permissions.canClose && !goal.isClosed && (
        <PageOptions.Link
          icon={Icons.IconCircleCheck}
          title="Mark as Complete"
          to={Paths.closeGoalPath(goal.id)}
          dataTestId="mark-as-complete"
        />
      )}

      {goal.permissions.canArchive && !goal.isArchived && (
        <PageOptions.Link
          icon={Icons.IconTrash}
          title="Archive"
          to={Paths.archiveGoalPath(goal.id)}
          dataTestId="archive-goal"
        />
      )}
    </PageOptions.Root>
  );
}

function Timeframe({ goal }: { goal: Goals.Goal }) {
  const timeframe = Timeframes.parse(goal.timeframe);

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
        <span className="text-red-500">Overdue by {plurarize(Timeframes.overdueDays(timeframe), "day", "days")}</span>
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
