import React from "react";

import * as Milestones from "@/graphql/Projects/milestones";
import * as Projects from "@/graphql/Projects";
import * as Time from "@/utils/time";

interface Milestone extends Milestones.Milestone {
  deletable: boolean;
}

export type MilestoneListState = {
  milestones: Milestone[];
  newMilestones: Milestone[];
  updatedMilestones: Milestone[];
  hasChanges: boolean;

  add: (milestone: Milestone) => void;
  edit: ({ id, title, deadlineAt }: { id: string; title: string; deadlineAt: string }) => void;
  remove: (id: string) => void;
};

export function useMilestoneListState(project: Projects.Project): MilestoneListState {
  const [milestones, setMilestones] = React.useState<Milestone[]>(getExistingMilestones(project));

  const add = React.useCallback((milestone: Milestone) => {
    const newMilestone = { ...milestone, deletable: true };
    setMilestones((milestones) => [...milestones, newMilestone]);
  }, []);

  const remove = React.useCallback((id: string) => {
    setMilestones((milestones) => milestones.filter((m) => m.id !== id));
  }, []);

  const edit = React.useCallback(({ id, title, deadlineAt }: { id: string; title: string; deadlineAt: string }) => {
    setMilestones((milestones) =>
      milestones.map((m) => {
        if (m.id !== id) return m;

        return { ...m, title, deadlineAt };
      }),
    );
  }, []);

  const newMilestones = React.useMemo(() => {
    return milestones.filter((m) => m.deletable);
  }, [milestones]);

  const updatedMilestones = React.useMemo(() => {
    return milestones.filter((m) => hasMilestoneChanged(m, project));
  }, [project, milestones]);

  const hasChanges = React.useMemo(
    () => newMilestones.length > 0 || updatedMilestones.length > 0,
    [newMilestones, updatedMilestones],
  );

  return {
    milestones,
    newMilestones,
    updatedMilestones,
    hasChanges,

    add,
    edit,
    remove,
  };
}

function getExistingMilestones(project: Projects.Project): Milestone[] {
  if (!project.milestones) return [];

  return project.milestones
    .filter((m) => !!m)
    .filter((m) => m?.status === "pending")
    .map((m) => ({ ...m, deletable: false })) as Milestone[];
}

function hasMilestoneChanged(m: Milestone, project: Projects.Project): boolean {
  if (m.deletable) return false;

  const original = project.milestones!.find((om) => om!.id === m.id);
  if (!original) return false;

  const originalTitle = original.title;
  const originalDeadline = Time.parse(original.deadlineAt);

  if (originalTitle !== m.title) return true;
  if (Time.dateChanged(originalDeadline, Time.parse(m.deadlineAt))) return true;

  return false;
}
