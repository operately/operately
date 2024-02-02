import * as Goals from "@/models/goals";
import * as TipTapEditor from "@/components/Editor";
import * as Updates from "@/graphql/Projects/updates";
import * as People from "@/graphql/People";
import * as Projects from "@/graphql/Projects";

import { useNavigate } from "react-router-dom";
import { useListState } from "@/utils/useListState";

interface UseFormOptions {
  mode: "create" | "edit";
  goal: Goals.Goal;
  checkIn?: Updates.Update;
}

export interface FormState {
  editor: TipTapEditor.EditorState;
  targets: TargetState[];
  updateTarget: (id: string, value: number) => void;

  submit: () => void;
  submitting: boolean;
  submitDisabled?: boolean;
  submitButtonLabel?: string;

  cancelPath: string;
}

export function useForm(options: UseFormOptions): FormState {
  const navigate = useNavigate();
  const goal = options.goal;

  const editor = TipTapEditor.useEditor({
    placeholder: `Write your updates here...`,
    peopleSearch: People.usePeopleSearch(),
    className: "min-h-[350px] py-2 font-medium",
  });

  const [targets, { update: updateTarget }] = useTargetListState(goal);

  const [post, { loading: submittingPost }] = Projects.usePostUpdate({
    onCompleted: (data: any) => navigate(`/goals/${goal.id}/check-ins/${data.createUpdate.id}`),
  });

  const [edit, { loading: submittingEdit }] = Projects.useEditUpdate({
    onCompleted: (data: any) => navigate(`/goals/${goal.id}/check-ins/${data.editUpdate.id}`),
  });

  const submit = () => {
    if (!editor.editor) return;
    if (editor.uploading) return;

    if (options.mode === "create") {
      post({
        variables: {
          input: {
            updatableType: "goal",
            updatableId: goal.id,
            content: JSON.stringify(editor.editor.getJSON()),
            messageType: "goal-check-in",
            newTargetValues: JSON.stringify(targets.map((target) => ({ id: target.id, value: target.value }))),
          },
        },
      });
      return;
    } else {
      edit({
        variables: {
          input: {
            content: JSON.stringify(editor.editor.getJSON()),
            newTargetValues: JSON.stringify(targets.map((target) => ({ id: target.id, value: target.value }))),
          },
        },
      });

      return;
    }
  };

  const submitting = submittingPost || submittingEdit;
  const submitButtonLabel = options.mode === "create" ? "Submit" : "Save Changes";
  const cancelPath =
    options.mode === "create" ? `/goals/${goal.id}/check-ins` : `/goals/${goal.id}/check-ins/${options.checkIn!.id}`;

  return {
    editor,
    targets,
    updateTarget,
    submit,
    submitting,
    submitButtonLabel,
    cancelPath,
  };
}

interface TargetState {
  id: string;
  name: string;
  value: number;
  from: number;
  to: number;
  unit: string;
}

function useTargetListState(goal: Goals.Goal): [TargetState[], { update: (id: string, value: number) => void }] {
  const [targets, { update }] = useListState<TargetState>(
    goal.targets!.map((target) => ({
      id: target!.id,
      name: target!.name,
      value: target!.value,
      from: target!.from,
      to: target!.to,
      unit: target!.unit,
    })),
  );

  const updateValue = (id: string, value: number) => update(id, "value", value);

  return [targets, { update: updateValue }];
}
