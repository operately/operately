import * as React from "react";
import * as Projects from "@/graphql/Projects";
import * as Time from "@/utils/time";

import { useNavigate } from "react-router-dom";
import { useMilestoneListState, MilestoneListState } from "./useMilestoneListState";
import { createPath } from "@/utils/paths";

interface FormState {
  startTime: Date | null;
  setStartTime: (date: Date | null) => void;

  dueDate: Date | null;
  setDueDate: (date: Date | null) => void;

  milestoneList: MilestoneListState;

  submit: () => void;
  hasChanges: boolean;
  submitting: boolean;
}

export function useForm(project: Projects.Project): FormState {
  const navigate = useNavigate();
  const milestonesPath = createPath("projects", project.id, "milestones");

  const oldStart = Time.parse(project.startedAt);
  const oldDue = Time.parse(project.deadline);

  const [startTime, setStartTime] = React.useState<Date | null>(oldStart);
  const [dueDate, setDueDate] = React.useState<Date | null>(oldDue);

  const milestoneList = useMilestoneListState(project);

  const hasChanges = React.useMemo(() => {
    if (Time.dateChanged(startTime, oldStart)) return true;
    if (Time.dateChanged(dueDate, oldDue)) return true;
    if (milestoneList.hasChanges) return true;

    return false;
  }, [startTime, dueDate, milestoneList]);

  const [edit, { loading }] = Projects.useEditProjectTimeline({
    onCompleted: () => navigate(milestonesPath),
  });

  const submit = async () => {
    await edit({
      variables: {
        input: {
          projectID: project.id,
          projectStartDate: startTime && Time.toDateWithoutTime(startTime),
          projectDueDate: dueDate && Time.toDateWithoutTime(dueDate),
          newMilestones: milestoneList.newMilestones.map((m) => ({
            title: m.title,
            dueTime: m.deadlineAt && Time.toDateWithoutTime(Time.parseISO(m.deadlineAt)),
          })),
          milestoneUpdates: milestoneList.updatedMilestones.map((m) => ({
            id: m.id,
            title: m.title,
            dueTime: m.deadlineAt && Time.toDateWithoutTime(Time.parseISO(m.deadlineAt)),
          })),
        },
      },
    });
  };

  return {
    startTime,
    setStartTime,
    dueDate,
    setDueDate,
    milestoneList,

    submit,
    hasChanges,
    submitting: loading,
  };
}
