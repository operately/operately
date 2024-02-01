import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Icons from "@tabler/icons-react";

import { Form, useForm } from "@/features/ProjectCheckInForm";

import { useLoadedData } from "./loader";

export function Page() {
  const { project } = useLoadedData();

  const form = useForm(project);

  return (
    <Pages.Page title={["Check-In", project.name]}>
      <Paper.Root>
        <Paper.Navigation>
          <Paper.NavItem linkTo={`/projects/${project.id}`}>
            <Icons.IconClipboardList size={16} />
            {project.name}
          </Paper.NavItem>

          <Paper.NavSeparator />

          <Paper.NavItem linkTo={`/projects/${project.id}/status_updates`}>Check-Ins</Paper.NavItem>
        </Paper.Navigation>

        <Paper.Body>
          <Form form={form} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
