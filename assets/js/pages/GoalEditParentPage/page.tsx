import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";

import { useLoadedData } from "./loader";
import { Paths } from "@/routes/paths";
import { useNavigate } from "react-router-dom";
import { GoalSelector } from "@/features/goals/GoalTree/GoalSelector";

export function Page() {
  const { goal } = useLoadedData();

  const goalPath = Paths.goalPath(goal.id);

  return (
    <Pages.Page title={["Changing Parent", goal.name]}>
      <Paper.Root>
        <Paper.Navigation>
          <Paper.NavItem linkTo={goalPath}>{goal.name}</Paper.NavItem>
        </Paper.Navigation>

        <Paper.Body>
          <div className="text-content-accent text-2xl font-extrabold mb-8">Choose a new parent for the goal</div>

          <GoalList />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function GoalList() {
  const { goal, goals } = useLoadedData();

  const navigate = useNavigate();
  const goalPath = Paths.goalPath(goal.id);

  const [select] = Goals.useChangeGoalParentMutation({ onCompleted: () => navigate(goalPath) });

  const handleSelect = React.useCallback(async (selectedGoal: Goals.Goal) => {
    await select({
      variables: {
        input: {
          goalId: goal.id,
          parentGoalId: selectedGoal.id,
        },
      },
    });
  }, []);

  const selectableGoals = Goals.filterPossibleParentGoals(goals, goal);

  return <GoalSelector goals={selectableGoals} onSelect={handleSelect} />;
}
