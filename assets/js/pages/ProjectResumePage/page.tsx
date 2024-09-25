import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Projects from "@/models/projects";
import * as Icons from "@tabler/icons-react";

import { useLoadedData } from "./loader";
import { useNavigateTo } from "@/routes/useNavigateTo";

import { PrimaryButton } from "@/components/Buttons";
import { DimmedLink } from "@/components/Link";
import { Paths } from "@/routes/paths";

export function Page() {
  const { project } = useLoadedData();

  return (
    <Pages.Page title={["Resume", project.name!]}>
      <Paper.Root size="small">
        <Paper.Navigation>
          <Paper.NavItem linkTo={Paths.projectPath(project.id!)}>
            <Icons.IconClipboardList size={16} />
            {project.name}
          </Paper.NavItem>
        </Paper.Navigation>

        <Paper.Body minHeight="none">
          <div className="text-content-accent text-3xl font-extrabold">Ready to resume project?</div>
          <div className="text-content text font-medium mt-2">
            Resuming will:
            <ul className="list-disc list-inside mt-4">
              <li>Reactivate project milestones and tasks</li>
              <li>Restart notifications for team members</li>
              <li>Make the project visible in active project lists</li>
            </ul>
          </div>

          <div className="flex items-center gap-6 mt-8">
            <ResumeButton project={project} />
            <DimmedLink to={Paths.projectPath(project.id!)}>Keep it paused</DimmedLink>
          </div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function ResumeButton({ project }) {
  const path = Paths.projectPath(project.id);
  const onSuccess = useNavigateTo(path);

  const [resume, { loading }] = Projects.useResumeProject();

  const handleClick = async () => {
    await resume({ projectId: project.id });
    onSuccess();
  };

  return (
    <PrimaryButton onClick={handleClick} testId="resume-project-button" loading={loading}>
      Resume project
    </PrimaryButton>
  );
}
