import * as React from "react";
import * as Projects from "@/graphql/Projects";
import * as Milestones from "@/graphql/Projects/milestones";
import * as Time from "@/utils/time";

import { useNavigate } from "react-router-dom";

interface FormState {
  startTime: Date | null;
  setStartTime: (date: Date | null) => void;

  dueDate: Date | null;
  setDueDate: (date: Date | null) => void;

  newMilestones: Milestones.Milestone[];
  addNewMilestone: (milestone: Milestones.Milestone) => void;

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

  const [newMilestones, addNewMilestone] = useMilestoneList([]);
  const [existingMilestones, _add] = useMilestoneList(getExistingMilestones(project));

  const hasChanges = React.useMemo(() => {
    if (startTime !== oldStart) return true;
    if (dueDate !== oldDue) return true;
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
    existingMilestones,

    submit,
    hasChanges,
    submitting: loading,
  };
}

type UseMilestoneListState = [
  milestones: Milestones.Milestone[],
  addMilestone: (milestone: Milestones.Milestone) => void,
];

function useMilestoneList(initial: Milestones.Milestone[]): UseMilestoneListState {
  const [milestones, setMilestones] = React.useState<Milestones.Milestone[]>(initial);

  const addMilestone = React.useCallback((milestone: Milestones.Milestone) => {
    setMilestones((milestones) => [...milestones, milestone]);
  }, []);

  return [milestones, addMilestone];
}

function getExistingMilestones(project: Projects.Project): Milestones.Milestone[] {
  if (!project.milestones) return [];

  return project.milestones.filter((m) => !!m) as Milestones.Milestone[];
}
