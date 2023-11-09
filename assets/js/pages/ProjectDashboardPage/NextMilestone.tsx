import React from "react";

import { Link } from "@/components/Link";
import { useNavigateTo } from "@/routes/useNavigateTo";
import { Summary } from "@/components/RichContent";
import { Label } from "./Label";
import * as Icons from "@tabler/icons-react";
import FormattedTime from "@/components/FormattedTime";

export function NextMilestone({ project }) {
  if (!project.nextMilestone) return null;

  const gotoMilestone = useNavigateTo(`/projects/${project.id}/milestones/${project.nextMilestone.id}`);
  const seeAllPath = `/projects/${project.id}/milestones`;

  return (
    <div>
      <Label>Next Milestone</Label>
      <div
        className="px-4 p-3 rounded-lg cursor-pointer border border-surface-outline bg-surface-accent w-2/3 mt-2"
        onClick={gotoMilestone}
      >
        <div className="flex items-center gap-1.5">
          <Icons.IconFlagFilled size={16} className="text-yellow-400" />
          <span className="font-bold underline decoration-white-2 cursor-pointer">{project.nextMilestone.title}</span>
        </div>

        <Summary jsonContent={project.nextMilestone.description} characterCount={200} />

        <div className="text-content-dimmed text-sm mt-1">
          Due date on <FormattedTime time={project.nextMilestone.deadlineAt} format="short-date" />
        </div>
      </div>

      <div className="mt-2">
        <Link to={seeAllPath}>View all milestones</Link>
      </div>
    </div>
  );
}
