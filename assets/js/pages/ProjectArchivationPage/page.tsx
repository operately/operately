import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Projects from "@/graphql/Projects";
import * as Icons from "@tabler/icons-react";

import { useLoadedData } from "./loader";
import { useNavigateTo } from "@/routes/useNavigateTo";

import { GhostButton } from "@/components/Button";
import { DimmedLink } from "@/components/Link";

export function Page() {
  const { project } = useLoadedData();

  return (
    <Pages.Page title={["Archiving ", project.name]}>
      <Paper.Root size="small">
        <Paper.Navigation>
          <Paper.NavItem linkTo={`/projects/${project.id}`}>
            <Icons.IconClipboardList size={16} />
            {project.name}
          </Paper.NavItem>
        </Paper.Navigation>

        <Paper.Body minHeight="none">
          <div className="text-content-accent text-3xl font-extrabold">Archive this project?</div>
          <div className="text-content text font-medium mt-2">
            The project will be kept for record keeping, but it won't be displayed on any space.
          </div>

          <div className="flex items-center gap-6 mt-8">
            <ArchiveButton project={project} />
            <DimmedLink to={`/projects/${project.id}`}>Cancel</DimmedLink>
          </div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function ArchiveButton({ project }) {
  const navigateToProjectArchive = useNavigateTo(`/projects/${project.id}`);

  const archiveForm = Projects.useArchiveForm({
    variables: {
      projectId: project.id,
    },
    onSuccess: () => navigateToProjectArchive(),
  });

  return (
    <GhostButton onClick={archiveForm.submit} testId="archive-project-button">
      Archive the Project
    </GhostButton>
  );
}
