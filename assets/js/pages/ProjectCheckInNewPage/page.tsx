import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Icons from "@tabler/icons-react";

import { Form, useForm } from "@/features/projectCheckIns/Form";
import { useLoadedData } from "./loader";
import { Paths } from "@/routes/paths";
import { useMe } from "@/contexts/CurrentUserContext";

export function Page() {
  const me = useMe();
  const { project } = useLoadedData();

  const form = useForm({ project, mode: "create", author: me });

  return (
    <Pages.Page title={["Check-In", project.name!]}>
      <Paper.Root>
        <Navigation project={project} />

        <Paper.Body>
          <Form form={form} />
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
