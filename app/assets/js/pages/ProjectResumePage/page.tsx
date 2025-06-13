import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Projects from "@/models/projects";
import * as React from "react";

import { useNavigateTo } from "@/routes/useNavigateTo";
import { useLoadedData } from "./loader";

import { DimmedLink, PrimaryButton } from "turboui";

import { usePaths } from "@/routes/paths";
export function Page() {
  const paths = usePaths();
  const { project } = useLoadedData();

  return (
    <Pages.Page title={["Resume", project.name!]}>
      <Paper.Root size="small">
        <Paper.Navigation items={[{ to: paths.projectPath(project.id!), label: project.name! }]} />

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
            <DimmedLink to={paths.projectPath(project.id!)}>Keep it paused</DimmedLink>
          </div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function ResumeButton({ project }) {
  const paths = usePaths();
  const path = paths.projectPath(project.id);
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
