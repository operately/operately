import * as React from "react";
import * as Projects from "@/models/projects";
import * as Time from "@/utils/time";

import { useNavigate } from "react-router-dom";
import { useMilestoneListState, MilestoneListState } from "./useMilestoneListState";
import { Paths } from "@/routes/paths";

interface Error {
  field: string;
  message: string;
}

export interface FormState {
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
  const navigate = useNavigate();
  const milestonesPath = Paths.projectMilestonesPath(project.id!);

  const oldStart = Time.parse(project.startedAt);
  const oldDue = Time.parse(project.deadline);

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

  const [edit, { loading }] = Projects.useEditTimelineMutation({
    onCompleted: () => {
      submitted.current = true;
      navigate(milestonesPath);
    },
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
            description: m.description,
            dueTime: m.deadlineAt && Time.toDateWithoutTime(Time.parseISO(m.deadlineAt)),
          })),
          milestoneUpdates: milestoneList.updatedMilestones.map((m) => ({
            id: m.id,
            title: m.title,
            description: m.description,
            dueTime: m.deadlineAt && Time.toDateWithoutTime(Time.parseISO(m.deadlineAt)),
          })),
        },
      },
    });
  };

  const cancel = () => {
    canceled.current = true;
    navigate(milestonesPath);
  };

  const errors = [];

  return {
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
