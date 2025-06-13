import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { DeprecatedPaths } from "@/routes/paths";
import { Form } from "./Form";
import { useLoadedData } from "./loader";

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
        { to: DeprecatedPaths.projectPath(project.id), label: project.name! },
        { to: DeprecatedPaths.projectCheckInsPath(project.id), label: "Check-Ins" },
      ]}
    />
  );
}
