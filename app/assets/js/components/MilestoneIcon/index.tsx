import React from "react";
import classNames from "classnames";

import { IconFlag3Filled } from "turboui";
import * as Projects from "@/models/projects";

interface MilestoneIconProps {
  milestone: Pick<Projects.Milestone, "status" | "timeframe">;
  className?: string;
  size?: number;
}

export function MilestoneIcon({ milestone, className, size = 16 }: MilestoneIconProps) {
  const classNameFinal = React.useMemo(() => {
    const isOverdue = Projects.isMilestoneOverdue(milestone);
    let color = "text-content-base";

    if (milestone.status === "done") {
      color = "text-green-700";
    } else {
      if (isOverdue) {
        color = "text-content-error";
      } else {
        color = "text-content-base";
      }
    }

    return classNames(color, className);
  }, [milestone.status, milestone.timeframe, className]);

  return <IconFlag3Filled size={size} className={classNameFinal} />;
}
