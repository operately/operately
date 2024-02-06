import React from "react";
import classNames from "classnames";

import * as Icons from "@tabler/icons-react";
import * as Projects from "@/models/projects";

export function MilestoneIcon({ milestone, className }: { milestone: Projects.Milestone; className?: string }) {
  const isOverdue = Projects.isMilestoneOverdue(milestone);
  const milestoneColor = isOverdue ? "text-red-500" : "text-content-base";
  const classNameFinal = classNames(milestoneColor, className);

  return <Icons.IconFlag3Filled size={16} className={classNameFinal} />;
}
