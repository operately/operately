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
    <Pages.Page title={["Pausing", project.name!]}>
      <Paper.Root size="small">
        <Paper.Navigation items={[{ to: DeprecatedPaths.projectPath(project.id!), label: project.name! }]} />

        <Paper.Body minHeight="none">
          <div className="text-content-accent text-3xl font-extrabold">Pause this project?</div>
          <div className="text-content text font-medium mt-2">
            Pausing this project will:
            <ul className="list-disc list-inside mt-4">
              <li>Suspend all associated milestones and tasks</li>
              <li>Stop notifications for team members</li>
              <li>Move the project to your paused projects list</li>
            </ul>
            <p className="mt-4">Note: You can resume the project at any time.</p>
          </div>

          <div className="flex items-center gap-6 mt-8">
            <PauseProject project={project} />
            <DimmedLink to={DeprecatedPaths.projectPath(project.id!)}>Keep it active</DimmedLink>
          </div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function PauseProject({ project }) {
  const path = DeprecatedPaths.projectPath(project.id);
  const onSuccess = useNavigateTo(path);

  const [pause, { loading }] = Projects.usePauseProject();

  const handleClick = async () => {
    await pause({ projectId: project.id });
    onSuccess();
  };

  return (
    <PrimaryButton onClick={handleClick} testId="pause-project-button" loading={loading}>
      Pause project
    </PrimaryButton>
  );
}
