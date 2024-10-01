import * as React from "react";
import * as Goals from "@/models/goals";
import * as TipTapEditor from "@/components/Editor";
import * as GoalCheckIns from "@/models/goalCheckIns";

import { useNavigate } from "react-router-dom";
import { useListState } from "@/utils/useListState";
import { isContentEmpty } from "@/components/RichContent/isContentEmpty";
import { Validators } from "@/utils/validators";
import { Paths } from "@/routes/paths";
import { Subscriber } from "@/models/notifications";
import { Options, SubscriptionsState, useSubscriptions } from "@/features/Subscriptions";

interface Error {
  field: string;
  message: string;
}

interface UseFormOptions {
  mode: "create" | "edit";
  goal: Goals.Goal;
  checkIn?: GoalCheckIns.Update;
  potentialSubscribers: Subscriber[];
}

export interface FormState {
  errors: Error[];

  mode: "create" | "edit";
  editor: TipTapEditor.EditorState;
  targets: TargetState[];
  updateTarget: (id: string, value: number | null) => void;

  submit: () => void;
  submitting: boolean;
  submitDisabled?: boolean;
  submitButtonLabel?: string;

  cancelPath: string;

  subscriptionsState: SubscriptionsState;
  goal: Goals.Goal;
}

export function useForm({ goal, mode, checkIn, potentialSubscribers = [] }: UseFormOptions): FormState {
  const navigate = useNavigate();
  const subscriptionsState = useSubscriptions(potentialSubscribers, {
    ignoreMe: true,
    notifyPrioritySubscribers: true,
  });

  const [errors, setErrors] = React.useState<Error[]>([]);

  const editor = TipTapEditor.useEditor({
    placeholder: `Write here...`,
    className: "min-h-[250px] py-2 font-medium",
    content: checkIn && JSON.parse(checkIn!.message!),
    mentionSearchScope: { type: "goal", id: goal.id! },
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

    if (mode === "create") {
      const res = await post({
        goalId: goal.id,
        content: JSON.stringify(editor.editor.getJSON()),
        newTargetValues: JSON.stringify(targets.map((target) => ({ id: target.id, value: target.value }))),
        sendNotificationsToEveryone: subscriptionsState.subscriptionType == Options.ALL,
        subscriberIds: subscriptionsState.currentSubscribersList,
      });

      navigate(Paths.goalProgressUpdatePath(res.update!.id));

      return true;
    } else {
      const res = await edit({
        id: checkIn!.id,
        content: JSON.stringify(editor.editor.getJSON()),
        newTargetValues: JSON.stringify(targets.map((target) => ({ id: target.id, value: target.value }))),
      });

      navigate(Paths.goalProgressUpdatePath(res.update!.id));

      return true;
    }
  };

  const submitting = submittingPost || submittingEdit;
  const submitButtonLabel = mode === "create" ? "Submit" : "Save Changes";
  const cancelPath = mode === "create" ? Paths.goalPath(goal.id!) : Paths.goalProgressUpdatePath(checkIn!.id!);

  return {
    mode,
    editor,
    targets,
    updateTarget,
    submit,
    submitting,
    submitButtonLabel,
    cancelPath,
    errors,
    subscriptionsState,
    goal,
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
