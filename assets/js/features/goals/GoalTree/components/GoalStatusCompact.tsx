import * as React from "react";
import * as Timeframes from "@/utils/timeframes";
import * as Icons from "@tabler/icons-react";

import { useTreeContext } from "../treeContext";
import { durationHumanized } from "@/utils/time";
import { GoalNode } from "../tree";

export function GoalStatusCompact({ node }: { node: GoalNode }) {
  const { density } = useTreeContext();

  if (density !== "compact") return null;
  if (node.type !== "goal") return null;

  const goal = node.asGoalNode().goal!;
  const timeframe = Timeframes.parse(goal.timeframe!);
  const isOverdue = Timeframes.isOverdue(timeframe) && !goal.isClosed;

  if (isOverdue) return <OverdueIndicator timeframe={timeframe} />;
  if (goal.isClosed) return <ClosedIndicator goal={goal} />;

  return null;
}

function OverdueIndicator({ timeframe }: { timeframe: Timeframes.Timeframe }) {
  return (
    <span className="text-sm font-medium shrink-0">
      <span className="text-content-error">Overdue by {durationHumanized(timeframe.endDate!, new Date())}</span>
    </span>
  );
}

function ClosedIndicator({ goal }: { goal: GoalNode["goal"] }) {
  return (
    <span className="text-sm font-medium shrink-0">
      {goal.success ? (
        <span className="text-callout-success-message flex items-center gap-1">
          <Icons.IconCircleCheckFilled size={16} /> Accomplished
        </span>
      ) : (
        <span className="text-content-error flex items-center gap-1">
          <Icons.IconCircleXFilled size={16} /> Not Accomplished
        </span>
      )}
    </span>
  );
}
