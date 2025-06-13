import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Projects from "@/models/projects";
import * as React from "react";

import { useNavigateTo } from "@/routes/useNavigateTo";
import { useLoadedData } from "./loader";

import { DeprecatedPaths } from "@/routes/paths";
import { DimmedLink, PrimaryButton } from "turboui";

export function Page() {
  const { project } = useLoadedData();

  return (
    <Pages.Page title={["Archiving ", project.name!]}>
      <Paper.Root size="small">
        <Paper.Navigation items={[{ to: DeprecatedPaths.projectPath(project.id!), label: project.name! }]} />

        <Paper.Body minHeight="none">
          <div className="text-content-accent text-3xl font-extrabold">Archive this project?</div>
          <div className="text-content text font-medium mt-2">
            The project will be kept for record keeping, but it won't be displayed on any space.
          </div>

          <div className="flex items-center gap-6 mt-8">
            <ArchiveButton project={project} />
            <DimmedLink to={DeprecatedPaths.projectPath(project.id!)}>Cancel</DimmedLink>
          </div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function ArchiveButton({ project }) {
  const navigateToProjectArchive = useNavigateTo(DeprecatedPaths.projectPath(project.id!));

  const [archive, { loading }] = Projects.useArchiveProject();

  const submit = async () => {
    await archive({ projectId: project.id });
    navigateToProjectArchive();
  };

  return (
    <PrimaryButton onClick={submit} testId="archive-project-button" loading={loading}>
      Archive the Project
    </PrimaryButton>
  );
}
