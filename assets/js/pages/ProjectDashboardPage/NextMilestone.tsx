import React from "react";

import { Link } from "@/components/Link";
import { DimmedLabel } from "./Label";
import * as Icons from "@tabler/icons-react";
import FormattedTime from "@/components/FormattedTime";

export function NextMilestone({ project }) {
  if (!project.nextMilestone) return null;

  return (
    <div>
      <DimmedLabel>Next Milestones</DimmedLabel>

      <div className="flex items-center gap-1.5 font-semibold">
        <Icons.IconFlagFilled size={16} className="text-yellow-400" />
        <Link to={`/projects/${project.id}/milestones/${project.nextMilestone.id}`}>{project.nextMilestone.title}</Link>

        <div className="text-sm font-medium">
          &middot; Due date on <FormattedTime time={project.nextMilestone.deadlineAt} format="short-date" />
        </div>
      </div>
    </div>
  );
}
