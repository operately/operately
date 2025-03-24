import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

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
  return (
    <Paper.Navigation
      items={[
        { to: Paths.projectPath(project.id), label: project.name! },
        { to: Paths.projectCheckInsPath(project.id), label: "Check-Ins" },
      ]}
    />
  );
}
