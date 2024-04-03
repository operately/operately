import * as React from "react";
import * as Tasks from "@/models/tasks";
import * as TipTapEditor from "@/components/Editor";
import * as People from "@/models/people";

import { Fields } from "./fields";

export interface DescriptionFormState {
  editing: boolean;

  editor: TipTapEditor.Editor | null;
  startEditing: () => void;

  cancel: () => void;
  submit: () => Promise<boolean>;
}

export function useDescriptionState(fields: Fields): DescriptionFormState {
  const [editing, setEditing] = React.useState(false);

  const { editor } = TipTapEditor.useEditor({
    autoFocus: false,
    placeholder: "Write here...",
    peopleSearch: People.usePeopleSearch(),
    className: "min-h-[250px] p-2 py-1",
    content: fields.description && JSON.parse(fields.description),
  });

  const [editName] = Tasks.useChangeTaskDescriptionMutation({
    onCompleted: () => {
      setEditing(false);
    },
  });

  const submit = React.useCallback(async () => {
    if (!editor) return false;

    const content = JSON.stringify(editor.getJSON());

    await editName({
      variables: {
        input: {
          taskId: fields.taskID,
          description: content,
        },
      },
    });

    fields.setDescription(content);

    return true;
  }, [editor]);

  const cancel = React.useCallback(() => {
    setEditing(false);
  }, []);

  const startEditing = React.useCallback(() => {
    setEditing(true);
  }, []);

  return {
    editing,
    startEditing,

    editor,

    submit,
    cancel,
  };
}
