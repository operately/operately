import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Icons from "@tabler/icons-react";

import { Form, useForm } from "@/features/ProjectCheckInForm";

import { useLoadedData } from "./loader";

export function Page() {
  const { project, me } = useLoadedData();

  const form = useForm({ project, mode: "create", author: me });

  return (
    <Pages.Page title={["Check-In", project.name]}>
      <Paper.Root>
        <Navigation project={project} />

        <Paper.Body>
          <Form form={form} noSubmitActions project={project} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Navigation({ project }) {
  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={`/projects/${project.id}`}>
        <Icons.IconClipboardList size={16} />
        {project.name}
      </Paper.NavItem>
      <Paper.NavSeparator />
      <Paper.NavItem linkTo={`/projects/${project.id}/check-ins`}>Check-Ins</Paper.NavItem>
    </Paper.Navigation>
  );
}
