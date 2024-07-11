import * as React from "react";
import * as Goals from "@/models/goals";
import * as TipTapEditor from "@/components/Editor";
import * as GoalCheckIns from "@/models/goalCheckIns";

import { useNavigate } from "react-router-dom";
import { useListState } from "@/utils/useListState";
import { isContentEmpty } from "@/components/RichContent/isContentEmpty";
import { Validators } from "@/utils/validators";
import { Paths } from "@/routes/paths";

interface Error {
  field: string;
  message: string;
}

interface UseFormOptions {
  mode: "create" | "edit";
  goal: Goals.Goal;
  checkIn?: GoalCheckIns.Update;
}

export interface FormState {
  errors: Error[];

  editor: TipTapEditor.EditorState;
  targets: TargetState[];
  updateTarget: (id: string, value: number | null) => void;

  submit: () => void;
  submitting: boolean;
  submitDisabled?: boolean;
  submitButtonLabel?: string;

  cancelPath: string;
}

export function useForm(options: UseFormOptions): FormState {
  const navigate = useNavigate();
  const goal = options.goal;
  const [errors, setErrors] = React.useState<Error[]>([]);

  const editor = TipTapEditor.useEditor({
    placeholder: `Write here...`,
    className: "min-h-[250px] py-2 font-medium",
    content: options.checkIn && JSON.parse(options.checkIn!.message!),
  });

  const [targets, { update: updateTarget }] = useTargetListState(goal);

  const [post, { loading: submittingPost }] = GoalCheckIns.usePostGoalProgressUpdate();
  const [edit, { loading: submittingEdit }] = GoalCheckIns.useEditGoalProgressUpdate();

  const submit = async (): Promise<boolean> => {
    if (!editor.editor) return false;
    if (editor.uploading) return false;

    const errors = validate(editor.editor.getJSON(), targets);
    if (errors.length > 0) {
      setErrors(errors);
      return false;
    }

    if (options.mode === "create") {
      const res = await post({
        goalId: goal.id,
        content: JSON.stringify(editor.editor.getJSON()),
        newTargetValues: JSON.stringify(targets.map((target) => ({ id: target.id, value: target.value }))),
      });

      navigate(Paths.goalProgressUpdatePath(goal.id!, res.activity!.id));

      return true;
    } else {
      const res = await edit({
        id: options.checkIn!.id,
        content: JSON.stringify(editor.editor.getJSON()),
        newTargetValues: JSON.stringify(targets.map((target) => ({ id: target.id, value: target.value }))),
      });

      navigate(Paths.goalProgressUpdatePath(goal.id!, res.activity!.id));

      return true;
    }
  };

  const submitting = submittingPost || submittingEdit;
  const submitButtonLabel = options.mode === "create" ? "Submit" : "Save Changes";
  const cancelPath =
    options.mode === "create"
      ? Paths.goalCheckInsPath(goal.id!)
      : Paths.goalCheckInPath(goal.id!, options.checkIn!.id!);

  return {
    editor,
    targets,
    updateTarget,
    submit,
    submitting,
    submitButtonLabel,
    cancelPath,
    errors,
  };
}

interface TargetState {
  id: string;
  name: string;
  value: number | null;
  from: number;
  to: number;
  unit: string;
}

function useTargetListState(goal: Goals.Goal): [TargetState[], { update: (id: string, value: number) => void }] {
  const [targets, { update }] = useListState<TargetState>(
    goal.targets!.map((target: any) => ({
      id: target!.id,
      name: target!.name,
      value: target!.value,
      from: target!.from,
      to: target!.to,
      unit: target!.unit,
    })),
  );

  const updateValue = (id: string, value: number | null) => update(id, "value", value);

  return [targets, { update: updateValue }];
}

function validate(content: any, targets: TargetState[]): Error[] {
  const errors: Error[] = [];

  if (isContentEmpty(content)) {
    errors.push({ field: "content", message: "Content cannot be empty" });
  }

  targets.forEach((target) => {
    if (!Validators.nonEmptyNumber(target.value)) {
      errors.push({ field: target.id, message: `cannot be empty` });
    }
  });

  return errors;
}
