import * as React from "react";
import * as Icons from "@tabler/icons-react";
import * as Goals from "@/models/goals";

import { Paths } from "@/routes/paths";
import { DivLink } from "@/components/Link";

import classnames from "classnames";

export function Header({ goal }: { goal: Goals.Goal }) {
  return (
    <div className="flex-1">
      <ParentGoal goal={goal.parentGoal} />

      <div className={classnames("flex gap-3 items-start", "text-content-accent")}>
        <div className="bg-red-500/10 p-1.5 rounded-lg">
          <Icons.IconTarget size={24} className="text-red-500" />
        </div>

        <div className="inline-flex items-center gap-2 mt-1">
          <div className="font-bold text-2xl text-content-accent flex-1">{goal.name}</div>
        </div>
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
