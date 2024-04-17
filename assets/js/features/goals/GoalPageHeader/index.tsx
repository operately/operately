import * as React from "react";
import * as Icons from "@tabler/icons-react";
import * as Goals from "@/models/goals";

import { Paths } from "@/routes/paths";
import { DivLink } from "@/components/Link";

import * as Tabs from "@/components/Tabs";
import * as Paper from "@/components/PaperContainer";
import * as PageOptions from "@/components/PaperContainer/PageOptions";

import classnames from "classnames";
import FormattedTime from "@/components/FormattedTime";

import { Timeframe } from "@/utils/timeframe";

interface HeaderProps {
  activeTab: "status" | "subgoals" | "about";
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
            <TimeframeView goal={goal} />
          </div>
        </div>

        <Tabs.Root activeTab={activeTab}>
          <Tabs.Tab id="status" title="Current Status" linkTo={Paths.goalPath(goal.id)} />
          <Tabs.Tab id="subgoals" title="Sub-Goals and Projects" linkTo={Paths.goalSubgoalsPath(goal.id)} />
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
      <>
        <Icons.IconTarget size={14} className="text-red-500" />
        <DivLink
          to={Paths.goalPath(goal.id)}
          className="text-sm text-content-dimmed mx-1 hover:underline font-medium"
          testId="project-goal-link"
        >
          {goal.name}
        </DivLink>
      </>
    );
  } else {
    content = (
      <div className="text-sm text-content-dimmed font-medium flex items-center gap-1">
        <Icons.IconBuildingEstate size={14} />
        Company-wide goal
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

function TimeframeView({ goal }: { goal: Goals.Goal }) {
  return (
    <div className="font-medium text-sm mt-1 text-content-dimmed">
      Timeframe: {goal.timeframe} <TimeframeState goal={goal} />
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
  } else {
    const timeframe = Timeframe.parse(goal.timeframe);

    const isOverdue = timeframe.isOverdue();
    const remainingDays = timeframe.remainingDays();
    const overdueDays = timeframe.overdueDays();

    const remainingText = isOverdue ? `Overdue by ${overdueDays} days` : `${remainingDays} days left`;
    const remainingColor = isOverdue ? "text-red-500" : "text-accent-1";

    return (
      <span>
        &middot; <span className={remainingColor}>{remainingText}</span>
      </span>
    );
  }
}
