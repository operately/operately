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

  submit: () => void;
  submitting: boolean;
}

export function useForm(project: Projects.Project): FormState {
  const start = Time.parse(project.startedAt);
  const due = Time.parse(project.deadline);

  const [startTime, setStartTime] = React.useState<Date | null>(start);
  const [dueDate, setDueDate] = React.useState<Date | null>(due);

  const [newMilestones, addNewMilestone] = useMilestoneList();

  const navigate = useNavigate();

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

    submit,
    submitting: loading,
  };
}

function useMilestoneList(): [Milestones.Milestone[], (milestone: Milestones.Milestone) => void] {
  const [milestones, setMilestones] = React.useState<Milestones.Milestone[]>([]);

  const addMilestone = React.useCallback((milestone: Milestones.Milestone) => {
    setMilestones((milestones) => [...milestones, milestone]);
  }, []);

  return [milestones, addMilestone];
}
