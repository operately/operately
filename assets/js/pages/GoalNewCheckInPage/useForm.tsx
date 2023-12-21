import { useLoadedData } from "./loader";
import { useNavigate } from "react-router-dom";

import * as TipTapEditor from "@/components/Editor";
import * as People from "@/graphql/People";
import * as Projects from "@/graphql/Projects";
import * as Goals from "@/models/goals";
import { useListState } from "@/utils/useListState";

export function useForm() {
  const { goal } = useLoadedData();

  const navigate = useNavigate();

  const editor = TipTapEditor.useEditor({
    placeholder: `Write your updates here...`,
    peopleSearch: People.usePeopleSearch(),
    className: "min-h-[350px] py-2 font-medium",
  });

  const [targets, { update: updateTarget }] = useTargetListState(goal);

  const [post, { loading: submitting }] = Projects.usePostUpdate({
    onCompleted: (data: any) => navigate(`/goals/${goal.id}/check-ins/${data.createUpdate.id}`),
  });

  const submit = () => {
    if (!editor.editor) return;
    if (editor.uploading) return;

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
  };

  return { editor, targets, updateTarget, submit, submitting };
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
      value: target!.from,
      from: target!.from,
      to: target!.to,
      unit: target!.unit,
    })),
  );

  const updateValue = (id: string, value: number) => update(id, "value", value);

  return [targets, { update: updateValue }];
}
