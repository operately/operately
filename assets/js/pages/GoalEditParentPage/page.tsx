import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";

import { FilledButton } from "@/components/Button";
import { useLoadedData } from "./loader";
import { Paths } from "@/routes/paths";
import { useNavigate } from "react-router-dom";

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
          <div className="text-content-accent text-2xl font-extrabold">Choosing a new parent</div>
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

  const handleSelect = React.useCallback(async (parentGoalId: string | null) => {
    await select({
      variables: {
        input: {
          goalId: goal.id,
          parentGoalId: parentGoalId,
        },
      },
    });
  }, []);

  const selectableGoals = Goals.filterPossibleParentGoals(goals, goal);

  return (
    <div>
      <CurrentParentGoal goal={goal} onRemove={() => handleSelect(null)} />

      <div className="text-sm font-bold mt-8 mb-2">Choose a new parent</div>
      <div>
        {selectableGoals.map((parentGoal) => (
          <GoalListItem key={parentGoal.id} parentGoal={parentGoal} onSelect={() => handleSelect(parentGoal.id)} />
        ))}
      </div>
    </div>
  );
}

function CurrentParentGoal({ goal, onRemove }) {
  if (!goal.parentGoal) return null;

  return (
    <div className="bg-surface-dimmed border-y border-stroke-base -mx-12 px-12 py-3 my-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-bold">Current parent</div>
          {goal.parentGoal.name}
        </div>
        <NoParentGoal onSelect={onRemove} />
      </div>
    </div>
  );
}

function NoParentGoal({ onSelect }) {
  return (
    <FilledButton type="primary" size="xxs" onClick={onSelect}>
      Remove parent
    </FilledButton>
  );
}

function GoalListItem({ parentGoal, onSelect }) {
  return (
    <div className="flex items-center justify-between py-3 first:border-t border-b border-stroke-base">
      <div>{parentGoal.name}</div>
      <FilledButton type="primary" size="xxs" onClick={onSelect}>
        Select
      </FilledButton>
    </div>
  );
}
