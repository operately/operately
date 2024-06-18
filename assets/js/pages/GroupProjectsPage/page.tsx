import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { FilledButton } from "@/components/Button";
import { GroupPageNavigation } from "@/components/SpacePageNavigation";
import { ProjectList } from "@/features/ProjectList";

import { createPath } from "@/utils/paths";
import { useLoadedData } from "./loader";

export function Page() {
  const { group, projects } = useLoadedData();
  const newProjectPath = createPath("spaces", group.id, "projects", "new");

  return (
    <Pages.Page title={group.name}>
      <Paper.Root size="large">
        <Paper.Body minHeight="500px" backgroundColor="bg-surface">
          <GroupPageNavigation group={group} activeTab="projects" />

          <div className="flex items-center justify-between mb-8">
            <div className="font-extrabold text-3xl">Projects</div>
            <FilledButton type="primary" testId="add-project" size="sm" linkTo={newProjectPath}>
              Add Project
            </FilledButton>
          </div>

          <ProjectList projects={projects} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
