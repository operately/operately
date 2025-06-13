import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { Form } from "./Form";
import { useLoadedData } from "./loader";

import { usePaths } from "@/routes/paths";
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
  const paths = usePaths();
  return (
    <Paper.Navigation
      items={[
        { to: paths.projectPath(project.id), label: project.name! },
        { to: paths.projectCheckInsPath(project.id), label: "Check-Ins" },
      ]}
    />
  );
}
