import * as Projects from "@/models/projects";
import * as Time from "@/utils/time";
import * as React from "react";

import { usePaths } from "@/routes/paths";
import { useNavigate } from "react-router-dom";
import { DateField } from "turboui";
import { parseContextualDate, serializeContextualDate } from "@/models/contextualDates";
import { MilestoneListState, useMilestoneListState } from "./useMilestoneListState";

export interface FormState {
  projectId: string;

  startTime: DateField.ContextualDate | null;
  setStartTime: (date: DateField.ContextualDate | null) => void;

  dueDate: DateField.ContextualDate | null;
  setDueDate: (date: DateField.ContextualDate | null) => void;

  milestoneList: MilestoneListState;
  milestoneBeingEdited: string | null;
  setMilestoneBeingEdited: (id: string | null) => void;

  submit: () => void;
  cancel: () => void;
  errors: string[];
  hasChanges: boolean;
  submitting: boolean;

  blockLeavingPage: () => boolean;
}

export function useForm(project: Projects.Project): FormState {
  const paths = usePaths();
  const navigate = useNavigate();
  const milestonesPath = paths.projectMilestonesPath(project.id!);

  const oldStart = parseContextualDate(project.timeframe?.contextualStartDate);
  const oldDue = parseContextualDate(project.timeframe?.contextualEndDate);

  const [startTime, setStartTime] = React.useState<DateField.ContextualDate | null>(oldStart);
  const [dueDate, setDueDate] = React.useState<DateField.ContextualDate | null>(oldDue);
  const [milestoneBeingEdited, setMilestoneBeingEdited] = React.useState<string | null>(null);
  const [errors, setErrors] = useErrors([startTime]);

  const submitted = React.useRef(false);
  const canceled = React.useRef(false);

  const milestoneList = useMilestoneListState(project);

  const hasChanges = React.useMemo(() => {
    if (Time.dateChanged(startTime?.date || null, oldStart?.date || null)) return true;
    if (Time.dateChanged(dueDate?.date || null, oldDue?.date || null)) return true;
    if (milestoneList.hasChanges) return true;

    return false;
  }, [startTime, dueDate, milestoneList]);

  const [edit, { loading }] = Projects.useEditProjectTimeline();

  const submit = async () => {
    if (!startTime) {
      setErrors(prev => [...prev, "startTime"]);
      return;
    }

    await edit({
      projectId: project.id,
      projectStartDate: serializeContextualDate(startTime),
      projectDueDate: serializeContextualDate(dueDate),
      newMilestones: milestoneList.newMilestones.map((m) => ({
        title: m.title,
        description: m.description || null,
        dueDate: serializeContextualDate(m.deadline)!,
      })),
      milestoneUpdates: milestoneList.updatedMilestones.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description || null,
        dueDate: serializeContextualDate(m.deadline)!,
      })),
    });

    submitted.current = true;
    navigate(milestonesPath);
  };

  const cancel = () => {
    canceled.current = true;
    navigate(milestonesPath);
  };

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

function useErrors(deps: any[]) {
  const [errors, setErrors] = React.useState<string[]>([]);

  React.useEffect(() => {
    setErrors([]);
  }, deps);

  return [errors, setErrors] as const;
}