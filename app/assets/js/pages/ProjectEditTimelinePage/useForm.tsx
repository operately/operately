import * as Projects from "@/models/projects";
import * as Time from "@/utils/time";
import * as React from "react";

import { usePaths } from "@/routes/paths";
import { useNavigate } from "react-router-dom";
import { MilestoneListState, useMilestoneListState } from "./useMilestoneListState";

interface Error {
  field: string;
  message: string;
}

export interface FormState {
  projectId: string;

  startTime: Date | null;
  setStartTime: (date: Date | null) => void;

  dueDate: Date | null;
  setDueDate: (date: Date | null) => void;

  milestoneList: MilestoneListState;
  milestoneBeingEdited: string | null;
  setMilestoneBeingEdited: (id: string | null) => void;

  submit: () => void;
  cancel: () => void;
  errors: Error[];
  hasChanges: boolean;
  submitting: boolean;

  blockLeavingPage: () => boolean;
}

export function useForm(project: Projects.Project): FormState {
  const paths = usePaths();
  const navigate = useNavigate();
  const milestonesPath = paths.projectMilestonesPath(project.id!);

  const oldStart = Time.parseDate(project.startedAt);
  const oldDue = Time.parseDate(project.deadline);

  const [startTime, setStartTime] = React.useState<Date | null>(oldStart);
  const [dueDate, setDueDate] = React.useState<Date | null>(oldDue);
  const [milestoneBeingEdited, setMilestoneBeingEdited] = React.useState<string | null>(null);

  const submitted = React.useRef(false);
  const canceled = React.useRef(false);

  const milestoneList = useMilestoneListState(project);

  const hasChanges = React.useMemo(() => {
    if (Time.dateChanged(startTime, oldStart)) return true;
    if (Time.dateChanged(dueDate, oldDue)) return true;
    if (milestoneList.hasChanges) return true;

    return false;
  }, [startTime, dueDate, milestoneList]);

  const [edit, { loading }] = Projects.useEditProjectTimeline();

  const submit = async () => {
    await edit({
      projectId: project.id,
      projectStartDate: startTime && Time.toDateWithoutTime(startTime),
      projectDueDate: dueDate && Time.toDateWithoutTime(dueDate),
      newMilestones: milestoneList.newMilestones.map((m) => ({
        title: m.title,
        description: m.description,
        dueTime: m.deadlineAt && Time.toDateWithoutTime(m.deadlineAt as Date),
      })),
      milestoneUpdates: milestoneList.updatedMilestones.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        dueTime: m.deadlineAt && Time.toDateWithoutTime(m.deadlineAt as Date),
      })),
    });

    submitted.current = true;
    navigate(milestonesPath);
  };

  const cancel = () => {
    canceled.current = true;
    navigate(milestonesPath);
  };

  const errors = [];

  return {
    projectId: project.id!,

    startTime,
    setStartTime,
    dueDate,
    setDueDate,

    milestoneList,
    milestoneBeingEdited,
    setMilestoneBeingEdited,

    submit,
    cancel,
    errors,
    hasChanges,
    submitting: loading,

    blockLeavingPage: () => {
      if (submitted.current || canceled.current) return false;

      return hasChanges;
    },
  };
}
