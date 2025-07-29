import React from "react";

import * as Projects from "@/models/projects";
import { ParsedMilestone } from "@/models/milestones";
import * as Time from "@/utils/time";
import { compareIds } from "@/routes/paths";
import { DateField } from "turboui";
import { parseContextualDate } from "@/models/contextualDates";

export type MilestoneListState = {
  milestones: ParsedMilestone[];
  newMilestones: ParsedMilestone[];
  updatedMilestones: ParsedMilestone[];
  hasChanges: boolean;

  add: (milestone: ParsedMilestone) => void;
  edit: (attrs: EditAttrs) => void;
  remove: (id: string) => void;
};

interface EditAttrs {
  id: string;
  title: string;
  deadline: DateField.ContextualDate;
  description: any;
}

export function useMilestoneListState(project: Projects.Project): MilestoneListState {
  const [milestones, setMilestones] = React.useState(getExistingMilestones(project));

  const add = React.useCallback((milestone: ParsedMilestone) => {
    const newMilestone = { ...milestone, deletable: true };
    setMilestones((milestones) => [...milestones, newMilestone]);
  }, []);

  const remove = React.useCallback((id: string) => {
    setMilestones((milestones) => milestones.filter((m) => m.id !== id));
  }, []);

  const edit = React.useCallback(({ id, title, deadline, description }: EditAttrs) => {
    setMilestones((milestones) =>
      milestones.map((m) => {
        if (m.id !== id) return m;

        return { ...m, title, description, deadline };
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

function getExistingMilestones(project: Projects.Project): ParsedMilestone[] {
  if (!project.milestones) return [];

  return project.milestones
    .filter((m) => !!m)
    .filter((m) => m?.status === "pending")
    .map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      deadline: parseContextualDate(m.timeframe?.contextualEndDate),
      deletable: false,
    }));
}

function hasMilestoneChanged(m: ParsedMilestone, project: Projects.Project): boolean {
  if (m.deletable) return false;

  const original = project.milestones!.find((om) => compareIds(om!.id, m.id));
  if (!original) return false;

  const originalTitle = original.title;
  const originalDeadline = parseContextualDate(original.timeframe?.contextualEndDate);
  const originalDescription = original.description;

  if (originalTitle !== m.title) return true;
  if (Time.dateChanged(originalDeadline?.date, m.deadline?.date)) return true;
  if (originalDescription !== m.description) return true;

  return false;
}
