import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Goals from "@/models/goals";
import * as React from "react";

import { ProjectPageNavigation } from "@/components/ProjectPageNavigation";
import { GoalSelector } from "@/features/goals/GoalTree/GoalSelector";
import { useNavigate } from "react-router-dom";
import { useLoadedData } from "./loader";

import { usePaths } from "@/routes/paths";
export function Page() {
  const { project } = useLoadedData();

  return (
    <Pages.Page title={["Set Project Goal", project.name!]}>
      <Paper.Root>
        <ProjectPageNavigation project={project} />

        <Paper.Body>
          <div className="text-content-accent text-2xl font-extrabold mb-8">Choose a goal for the project</div>

          <GoalList />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function GoalList() {
  const paths = usePaths();
  const { project, goals } = useLoadedData();

  const navigate = useNavigate();
  const projectPath = paths.projectPath(project.id!);

  const [connect] = Goals.useConnectGoalToProject();

  const handleSelect = React.useCallback(async (selectedGoal: Goals.Goal) => {
    await connect({ goalId: selectedGoal.id, projectId: project.id });
    navigate(projectPath);
  }, []);

  return <GoalSelector goals={goals} onSelect={handleSelect} />;
}
