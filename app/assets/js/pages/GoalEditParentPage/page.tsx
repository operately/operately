import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Goals from "@/models/goals";
import * as React from "react";

import { GoalSelector } from "@/features/goals/GoalTree/GoalSelector";
import { useNavigate } from "react-router-dom";
import { useLoadedData } from "./loader";

import { usePaths } from "@/routes/paths";
export function Page() {
  const paths = usePaths();
  const { goal } = useLoadedData();

  return (
    <Pages.Page title={["Changing Parent", goal.name!]}>
      <Paper.Root>
        <Paper.Navigation items={[{ to: paths.goalPath(goal.id!), label: goal.name! }]} />

        <Paper.Body>
          <div className="text-content-accent text-2xl font-extrabold mb-8">Choose a new parent for the goal</div>

          <GoalList />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function GoalList() {
  const paths = usePaths();
  const { goal, goals } = useLoadedData();

  const navigate = useNavigate();
  const goalPath = paths.goalPath(goal.id!);

  const [select] = Goals.useChangeGoalParent();

  const handleSelect = React.useCallback(async (selectedGoal: Goals.Goal) => {
    await select({
      goalId: goal.id,
      parentGoalId: selectedGoal.id,
    });

    navigate(goalPath);
  }, []);

  const selectableGoals = Goals.filterPossibleParentGoals(goals, goal);

  return <GoalSelector goals={selectableGoals} onSelect={handleSelect} />;
}
