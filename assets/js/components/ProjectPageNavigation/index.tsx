import * as React from "react";
import * as Icons from "@tabler/icons-react";
import * as Paper from "@/components/PaperContainer";

import { createPath } from "@/utils/paths";

export function ProjectPageNavigation({ project }) {
  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={`/projects/${project.id}`}>
        <Icons.IconClipboardList size={16} />
        {project.name}
      </Paper.NavItem>
    </Paper.Navigation>
  );
}

export function ProjectMilestonesNavigation({ project }) {
  const dashboardPath = createPath("projects", project.id);
  const milestonesPath = createPath("projects", project.id, "milestones");

  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={dashboardPath}>
        <Icons.IconClipboardList size={16} />
        {project.name}
      </Paper.NavItem>
      <Paper.NavSeparator />
      <Paper.NavItem linkTo={milestonesPath}>Milestones</Paper.NavItem>
    </Paper.Navigation>
  );
}
