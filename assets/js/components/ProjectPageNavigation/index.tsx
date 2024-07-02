import * as React from "react";
import * as Icons from "@tabler/icons-react";
import * as Paper from "@/components/PaperContainer";
import * as Projects from "@/models/projects";

import { Paths } from "@/routes/paths";

export function ProjectPageNavigation({ project }) {
  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={Paths.projectPath(project.id)}>
        <Icons.IconClipboardList size={16} />
        {project.name}
      </Paper.NavItem>
    </Paper.Navigation>
  );
}

export function ProjectMilestonesNavigation({ project }: { project: Projects.Project }) {
  const dashboardPath = Paths.projectPath(project.id!);
  const milestonesPath = Paths.projectMilestonesPath(project.id!);

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
