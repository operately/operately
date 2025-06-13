import React from "react";
import { MiniWorkMap } from "turboui";

import { findGoalChildren, useDeleteGoal } from "@/models/goals";
import { useNavigate } from "react-router-dom";
import { useWorkItems } from "./useWorkItems";

import { WarningCallout } from "@/components/Callouts";
import Modal from "@/components/Modal";
import { PrimaryButton, SecondaryButton } from "turboui";
import { useLoadedData } from "./loader";

interface Props {
  showDeleteGoal: boolean;
  toggleShowDeleteGoal: () => void;
}

export function DeleteGoalModal({ showDeleteGoal, toggleShowDeleteGoal }: Props) {
  const { goal, projects, goals } = useLoadedData();
  const hasChildren = React.useMemo(() => findGoalChildren(goal, goals, projects).length > 0, [goal, goals, projects]);

  return (
    <Modal isOpen={showDeleteGoal} hideModal={toggleShowDeleteGoal} padding="1rem">
      {hasChildren ? (
        <GoalTree toggleShowDeleteGoal={toggleShowDeleteGoal} />
      ) : (
        <DeleteGoal toggleShowDeleteGoal={toggleShowDeleteGoal} />
      )}
    </Modal>
  );
}

function DeleteGoal({ toggleShowDeleteGoal }: { toggleShowDeleteGoal: () => void }) {
  const { goal } = useLoadedData();
  const [deleteGoal, { loading }] = useDeleteGoal();
  const navigate = useNavigate();

  const handleCancel = () => {
    if (loading) return;
    toggleShowDeleteGoal();
  };

  const handleDelete = async () => {
    if (loading) return;
    await deleteGoal({ goalId: goal.id });
    toggleShowDeleteGoal();
    navigate(paths.goalsPath());
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-center">Are you sure you want to delete this goal?</p>
      <div className="flex items-center justify-center gap-3">
        <SecondaryButton onClick={handleCancel}>Cancel</SecondaryButton>
        <PrimaryButton onClick={handleDelete} loading={loading} testId="confirm-delete-goal">
          Delete
        </PrimaryButton>
      </div>
    </div>
  );
}

function GoalTree({ toggleShowDeleteGoal }: { toggleShowDeleteGoal: () => void }) {
  const items = useWorkItems();

  return (
    <div className="max-w-2xl">
      <WarningCallout
        message="Unable to Delete Goal"
        description="This goal has connected subgoals and projects that need to be addressed first. Please delete or disconnect all of the following resources:"
      />

      <div className="border rounded-lg overflow-hidden my-4">
        <div className="bg-surface-dimmed p-3 border-b">
          <h4 className="font-medium">Subgoals and Projects</h4>
        </div>
        <div className="p-4 max-h-80 overflow-y-auto">
          <MiniWorkMap items={items} />
        </div>
      </div>

      <SecondaryButton size="sm" onClick={toggleShowDeleteGoal} testId="close-delete-goal-modal">
        Close
      </SecondaryButton>
    </div>
  );
}
