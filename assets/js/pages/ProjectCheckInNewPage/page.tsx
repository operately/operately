import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Icons from "@tabler/icons-react";

import { Paths } from "@/routes/paths";
import { useLoadedData } from "./loader";
import { Form } from "./Form";

export function Page() {
  const { project } = useLoadedData();

  return (
    <Pages.Page title={["Check-In", project.name!]}>
      <Paper.Root>
        <Navigation project={project} />

        <Paper.Body>
          <Form project={project} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Navigation({ project }) {
  const projectPath = Paths.projectPath(project.id);
  const checkInsPath = Paths.projectCheckInsPath(project.id);

  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={projectPath}>
        <Icons.IconClipboardList size={16} />
        {project.name}
      </Paper.NavItem>
      <Paper.NavSeparator />
      <Paper.NavItem linkTo={checkInsPath}>Check-Ins</Paper.NavItem>
    </Paper.Navigation>
  );
}
