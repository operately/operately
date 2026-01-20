import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { Form } from "./Form";
import { useLoadedData } from "./loader";

import { usePaths } from "@/routes/paths";

export function Page() {
  const { project } = useLoadedData();

  return (
    <Pages.Page title={["Check-In", project.name]}>
      <Paper.Root>
        <Navigation />

        <Paper.Body>
          <Form project={project} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Navigation() {
  const paths = usePaths();
  const { project } = useLoadedData();
  const items: Paper.NavigationItem[] = [];

if (project.space) {
    items.push({ to: paths.spacePath(project.space.id), label: project.space.name });
    items.push({ to: paths.spaceWorkMapPath(project.space.id, "projects" as const), label: "Work Map" });
  } else {
    items.push({ to: paths.workMapPath("projects"), label: "Work Map" });
  }

  items.push({ to: paths.projectPath(project.id), label: project.name });
  items.push({ to: paths.projectCheckInsPath(project.id), label: "Check-Ins" });

  return <Paper.Navigation items={items} />;
}
