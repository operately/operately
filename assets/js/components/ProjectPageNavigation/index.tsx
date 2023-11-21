import * as React from "react";
import * as Icons from "@tabler/icons-react";
import * as Paper from "@/components/PaperContainer";

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
