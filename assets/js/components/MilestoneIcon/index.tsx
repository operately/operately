import React from "react";
import classNames from "classnames";

import * as Icons from "@tabler/icons-react";
import * as Projects from "@/models/projects";

interface MilestoneIconProps {
  milestone: Pick<Projects.Milestone, "status" | "deadlineAt">;
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
        color = "text-red-500";
      } else {
        color = "text-content-base";
      }
    }

    return classNames(color, className);
  }, [milestone.status, milestone.deadlineAt, className]);

  return <Icons.IconFlag3Filled size={size} className={classNameFinal} />;
}
