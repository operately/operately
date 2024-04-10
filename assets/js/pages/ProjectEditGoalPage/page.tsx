import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";

import { ProjectPageNavigation } from "@/components/ProjectPageNavigation";
import { useLoadedData } from "./loader";
import { Paths } from "@/routes/paths";
import { GoalSelector } from "@/features/goals/GoalTree/GoalSelector";
import { useNavigate } from "react-router-dom";

export function Page() {
  const { project } = useLoadedData();

  return (
    <Pages.Page title={["Set Project Goal", project.name]}>
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
  const { project, goals } = useLoadedData();

  const navigate = useNavigate();
  const projectPath = Paths.projectPath(project.id);

  const [connect] = Goals.useConnectGoalToProjectMutation({ onCompleted: () => navigate(projectPath) });

  const handleSelect = React.useCallback(async (selectedGoal: Goals.Goal) => {
    connect({
      variables: {
        goalId: selectedGoal.id,
        projectId: project.id,
      },
    });
  }, []);

  return <GoalSelector goals={goals} onSelect={handleSelect} />;
}
