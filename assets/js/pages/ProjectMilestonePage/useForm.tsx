import * as React from "react";
import * as Milestones from "@/graphql/Projects/milestones";
import * as TipTapEditor from "@/components/Editor";
import * as People from "@/graphql/People";

import { useRefresh } from "./loader";

interface FormState {
  description: DescriptionState;
}

export function useFormState(milestone: Milestones.Milestone): FormState {
  const description = useDescriptionState(milestone);

  return {
    description,
  };
}

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
    className: "pb-2 min-h-[200px]",
    peopleSearch: People.usePeopleSearch(),
  });

  const startEditing = React.useCallback(() => {
    setState("edit");
    editor.commands.setContent(JSON.parse(milestone.description || "{}"));
    editor.commands.focus();
  }, [milestone, editor]);

  const stopEditing = React.useCallback(() => {
    setState("show");
  }, [editor]);

  const [post, { loading }] = Milestones.useUpdateDescription();

  const submit = React.useCallback(async () => {
    if (!editor) return;
    if (!submittable) return;
    if (loading) return;

    const content = empty ? null : JSON.stringify(editor.getJSON());

    await post({
      variables: {
        input: {
          id: milestone.id,
          description: content,
        },
      },
    });

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
