import * as React from "react";
import * as Milestones from "@/models/milestones";
import * as Projects from "@/models/projects";
import * as TipTapEditor from "@/components/Editor";
import * as Time from "@/utils/time";

import { useRefresh } from "./loader";
import { useNavigateTo } from "@/routes/useNavigateTo";
import { Paths } from "@/routes/paths";

export interface FormState {
  milestone: Milestones.Milestone;
  titleAndDeadline: TitleAndDeadlineState;
  description: DescriptionState;

  archive: () => void;
  completeMilestone: () => void;
  reopenMilestone: () => void;
}

export function useFormState(project: Projects.Project, milestone: Milestones.Milestone): FormState {
  const description = useDescriptionState(milestone);
  const titleAndDeadline = useTitleAndDeadlineState(milestone);
  const completeMilestone = useCompleteMilestone(milestone);
  const reopenMilestone = useReopenMilestone(milestone);
  const archive = useArchiveMilestone(project, milestone);

  return {
    milestone,
    description,
    titleAndDeadline,
    archive,
    completeMilestone,
    reopenMilestone,
  };
}

const useCompleteMilestone = (milestone: Milestones.Milestone) => {
  const refresh = useRefresh();
  const [post] = Milestones.usePostMilestoneComment();

  return async () => {
    await post({
      milestoneId: milestone.id,
      content: null,
      action: "complete",
    });

    refresh();
  };
};

const useReopenMilestone = (milestone: Milestones.Milestone) => {
  const refresh = useRefresh();
  const [post] = Milestones.usePostMilestoneComment();

  return async () => {
    await post({
      milestoneId: milestone.id,
      content: null,
      action: "reopen",
    });

    refresh();
  };
};

const useArchiveMilestone = (project: Projects.Project, milestone: Milestones.Milestone) => {
  const refresh = useRefresh();
  const gotoProject = useNavigateTo(Paths.projectPath(project.id!));

  const [post] = Milestones.useRemoveProjectMilestone();

  return async () => {
    await post({ milestoneId: milestone.id });

    refresh();
    gotoProject();
  };
};

interface DescriptionState {
  state: "show" | "edit";
  editor: any;
  submitting: boolean;
  submittable: boolean;

  startEditing: () => void;
  submit: (value: string) => void;
  stopEditing: () => void;
  cancelEditing: () => void;
}

function useDescriptionState(milestone: Milestones.Milestone): DescriptionState {
  const refresh = useRefresh();
  const [state, setState] = React.useState<"show" | "edit">("show");

  const { editor, submittable, empty } = TipTapEditor.useEditor({
    placeholder: "Write here...",
    content: JSON.parse(milestone.description || "{}"),
    editable: true,
    className: "p-2 min-h-[200px]",
  });

  const startEditing = React.useCallback(() => {
    setState("edit");
    editor.commands.setContent(JSON.parse(milestone.description || "{}"));
    editor.commands.focus();
  }, [milestone, editor]);

  const stopEditing = React.useCallback(() => {
    setState("show");
  }, [editor]);

  const [post, { loading }] = Milestones.useUpdateMilestoneDescription();

  const submit = React.useCallback(async () => {
    if (!editor) return;
    if (!submittable) return;
    if (loading) return;

    const content = empty ? null : JSON.stringify(editor.getJSON());

    await post({ id: milestone.id, description: content });

    refresh();
    stopEditing();
  }, [submittable, loading, milestone, stopEditing, refresh, editor, empty, post]);

  return {
    state,
    editor,
    submit,
    submitting: loading,
    submittable,
    startEditing,
    stopEditing,
    cancelEditing: stopEditing,
  };
}

interface TitleAndDeadlineState {
  state: "show" | "edit";
  startEditing: () => void;

  title: string;
  date: Date | null;

  setTitle: (value: string) => void;
  setDate: (value: Date | null) => void;
  submit: () => Promise<boolean>;
  cancel: () => void;

  errors: {
    title: boolean;
    date: boolean;
  };
}

function useTitleAndDeadlineState(milestone: Milestones.Milestone): TitleAndDeadlineState {
  const refresh = useRefresh();

  const [state, setState] = React.useState<"show" | "edit">("show");
  const [title, setTitle] = React.useState(milestone.title);
  const [date, setDate] = React.useState(Time.parse(milestone.deadlineAt));

  const [titleError, setTitleError] = React.useState(false);
  const [dateError, setDateError] = React.useState(false);

  const startEditing = React.useCallback(() => setState("edit"), []);

  const [post, { loading }] = Milestones.useUpdateMilestone();

  const submit = React.useCallback(async () => {
    if (loading) return false;

    if (title!.trim().length === 0) {
      setTitleError(true);
      return false;
    }

    if (!date) {
      setDateError(true);
      return false;
    }

    await post({
      milestoneId: milestone.id,
      title: title,
      deadlineAt: Time.toDateWithoutTime(date),
    });

    setState("show");
    refresh();
    return true;
  }, [title, date, post, loading, milestone]);

  const cancel = React.useCallback(() => {
    setTitle(milestone.title);
    setDate(Time.parseDate(milestone.deadlineAt));
    setState("show");
  }, [milestone]);

  return {
    state,
    startEditing,

    title: title!,
    date,

    setTitle,
    setDate,

    submit,
    cancel,

    errors: {
      title: titleError,
      date: dateError,
    },
  };
}
