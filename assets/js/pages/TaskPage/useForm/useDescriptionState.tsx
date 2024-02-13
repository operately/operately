import * as React from "react";
import * as Tasks from "@/models/tasks";
import * as TipTapEditor from "@/components/Editor";
import * as People from "@/graphql/People";

export interface DescriptionState {
  description: string | null;
  editing: boolean;

  editor: TipTapEditor.Editor | null;
  setEditing: (editing: boolean) => void;

  cancel: () => void;
  submit: () => Promise<boolean>;
}

export function useDescriptionState(task: Tasks.Task): DescriptionState {
  const [description, setDescription] = React.useState(task.description!);
  const [editing, setEditing] = React.useState(false);

  const { editor } = TipTapEditor.useEditor({
    autoFocus: false,
    placeholder: "Write here...",
    peopleSearch: People.usePeopleSearch(),
    className: "min-h-[250px] p-2 py-1",
    content: task.description && JSON.parse(task.description),
  });

  const [editName] = Tasks.useChangeTaskDescriptionMutation({
    onCompleted: () => {
      setEditing(false);
    },
  });

  const submit = React.useCallback(async () => {
    if (!editor) return false;

    await editName({
      variables: {
        input: {
          taskId: task.id,
          description: JSON.stringify(editor.getJSON()),
        },
      },
    });

    setDescription(JSON.stringify(editor.getJSON()));

    return true;
  }, [editor]);

  const cancel = React.useCallback(() => {
    setEditing(false);
  }, []);

  return {
    description,
    editing,
    editor,
    setEditing,

    submit,
    cancel,
  };
}
