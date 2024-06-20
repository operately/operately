import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Projects from "@/models/projects";
import * as Icons from "@tabler/icons-react";

import { useLoadedData } from "./loader";
import { useNavigateTo } from "@/routes/useNavigateTo";

import { FilledButton } from "@/components/Button";
import { DimmedLink } from "@/components/Link";
import { Paths } from "@/routes/paths";

export function Page() {
  const { project } = useLoadedData();

  return (
    <Pages.Page title={["Pausing", project.name!]}>
      <Paper.Root size="small">
        <Paper.Navigation>
          <Paper.NavItem linkTo={`/projects/${project.id}`}>
            <Icons.IconClipboardList size={16} />
            {project.name}
          </Paper.NavItem>
        </Paper.Navigation>

        <Paper.Body minHeight="none">
          <div className="text-content-accent text-3xl font-extrabold">Pause this project?</div>
          <div className="text-content text font-medium mt-2">
            Pausing a project will stop all notifications and updates for this project. You can resume it at any time.
          </div>

          <div className="flex items-center gap-6 mt-8">
            <PauseProject project={project} />
            <DimmedLink to={`/projects/${project.id}`}>Cancel</DimmedLink>
          </div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function PauseProject({ project }) {
  const path = Paths.projectPath(project.id);
  const onSuccess = useNavigateTo(path);

  const [pause] = Projects.usePauseProjectMutation({ onCompleted: onSuccess });

  const handleClick = async () => {
    await pause({ variables: { input: { projectId: project.id } } });
  };

  return (
    <FilledButton onClick={handleClick} testId="pause-project-button">
      Pause the Project
    </FilledButton>
  );
}
