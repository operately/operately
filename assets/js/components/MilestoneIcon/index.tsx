import React from "react";
import classNames from "classnames";

import * as Icons from "@tabler/icons-react";
import * as Projects from "@/models/projects";

interface MilestoneIconProps {
  milestone: Projects.Milestone;
  className?: string;
  iconSize?: number;
}

export function MilestoneIcon({ milestone, className, iconSize = 16 }: MilestoneIconProps) {
  const isOverdue = Projects.isMilestoneOverdue(milestone);
  const milestoneColor = isOverdue ? "text-red-500" : "text-content-base";
  const classNameFinal = classNames(milestoneColor, className);

  return <Icons.IconFlag3Filled size={iconSize} className={classNameFinal} />;
}
