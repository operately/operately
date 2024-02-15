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
  console.log(milestone);
  const isOverdue = Projects.isMilestoneOverdue(milestone);
  console.log(isOverdue);
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

  const classNameFinal = classNames(color, className);

  return <Icons.IconFlag3Filled size={size} className={classNameFinal} />;
}
