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
  submitting: boolean;
}

export function useForm(project: Projects.Project): FormState {
  const navigate = useNavigate();

  const start = Time.parse(project.startedAt);
  const due = Time.parse(project.deadline);

  const [startTime, setStartTime] = React.useState<Date | null>(start);
  const [dueDate, setDueDate] = React.useState<Date | null>(due);

  const [newMilestones, addNewMilestone] = useMilestoneList([]);
  const [existingMilestones, _add] = useMilestoneList(getExistingMilestones(project));

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
          newMilestones: newMilestones,
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
