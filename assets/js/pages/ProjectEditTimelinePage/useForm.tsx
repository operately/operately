import * as React from "react";
import * as Projects from "@/graphql/Projects";
import * as Milestones from "@/graphql/Projects/milestones";
import * as Time from "@/utils/time";

import { useNavigate } from "react-router-dom";

interface Milestone extends Milestones.Milestone {
  deletable: boolean;
}

interface FormState {
  startTime: Date | null;
  setStartTime: (date: Date | null) => void;

  dueDate: Date | null;
  setDueDate: (date: Date | null) => void;

  newMilestones: Milestone[];
  addNewMilestone: (milestone: Milestone) => void;
  editNewMilestone: ({ id, title, deadlineAt }: { id: string; title: string; deadlineAt: string }) => void;
  removeNewMilestone: (id: string) => void;

  existingMilestones: Milestones.Milestone[];

  submit: () => void;
  hasChanges: boolean;
  submitting: boolean;
}

export function useForm(project: Projects.Project): FormState {
  const navigate = useNavigate();

  const oldStart = Time.parse(project.startedAt);
  const oldDue = Time.parse(project.deadline);

  const [startTime, setStartTime] = React.useState<Date | null>(oldStart);
  const [dueDate, setDueDate] = React.useState<Date | null>(oldDue);

  const [newMilestones, addNewMilestone, editNewMilestone, removeNewMilestone] = useMilestoneList([]);
  const [existingMilestones, _add, _remove] = useMilestoneList(getExistingMilestones(project));

  const hasChanges = React.useMemo(() => {
    if (dateChanged(startTime, oldStart)) return true;
    if (dateChanged(dueDate, oldDue)) return true;
    if (newMilestones.length > 0) return true;

    return false;
  }, [startTime, dueDate, newMilestones]);

  const [edit, { loading }] = Projects.useEditProjectTimeline({
    onCompleted: () => {
      navigate(`/projects/${project.id}`);
    },
  });

  const submit = async () => {
    await edit({
      variables: {
        input: {
          projectID: project.id,
          projectStartDate: startTime && Time.toDateWithoutTime(startTime),
          projectDueDate: dueDate && Time.toDateWithoutTime(dueDate),
          newMilestones: newMilestones.map((m) => ({
            title: m.title,
            dueTime: m.deadlineAt && Time.toDateWithoutTime(Time.parseISO(m.deadlineAt)),
          })),
          milestoneUpdates: [],
        },
      },
    });

    navigate(`/projects/${project.id}`);
  };

  return {
    startTime,
    setStartTime,
    dueDate,
    setDueDate,
    newMilestones,
    addNewMilestone,
    editNewMilestone,
    removeNewMilestone,
    existingMilestones,

    submit,
    hasChanges,
    submitting: loading,
  };
}

type UseMilestoneListState = [
  milestones: Milestone[],
  addMilestone: (milestone: Milestone) => void,
  editMilestone: ({ id, title, deadlineAt }: { id: string; title: string; deadlineAt: string }) => void,
  removeMilestone: (id: string) => void,
];

function useMilestoneList(initial: Milestone[]): UseMilestoneListState {
  const [milestones, setMilestones] = React.useState<Milestone[]>(initial);

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

  return [milestones, add, edit, remove];
}

function getExistingMilestones(project: Projects.Project): Milestone[] {
  if (!project.milestones) return [];

  return project.milestones.filter((m) => !!m).map((m) => ({ ...m, deletable: false })) as Milestone[];
}

function dateChanged(a: Date | null, b: Date | null): boolean {
  if (!a && !b) return false;
  if (!a && b) return true;
  if (a && !b) return true;

  return !Time.isSameDay(a!, b!);
}
