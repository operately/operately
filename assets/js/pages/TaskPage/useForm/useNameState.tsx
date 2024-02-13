import * as React from "react";
import * as Tasks from "@/models/tasks";

export interface NameState {
  name: string;
  editing: boolean;

  setName: (name: string) => void;
  setEditing: (editing: boolean) => void;

  cancel: () => void;
  submit: () => Promise<boolean>;

  error: boolean;
}

export function useNameState(task: Tasks.Task) {
  const [initialValue, setInitialValue] = React.useState(task.name);
  const [name, setName] = React.useState(initialValue);
  const [editing, setEditing] = React.useState(false);
  const [error, setError] = React.useState(false);

  const [editName] = Tasks.useEditTaskNameMutation({
    onCompleted: () => {
      setEditing(false);
    },
  });

  const submit = React.useCallback(async () => {
    if (name === initialValue) {
      setEditing(false);
      return false;
    }

    if (name.trim() === "") {
      setError(true);
      return false;
    }

    await editName({
      variables: {
        input: {
          id: task.id,
          name,
        },
      },
    });

    setInitialValue(name);

    return true;
  }, [initialValue, name]);

  const cancel = React.useCallback(() => {
    setName(initialValue);
    setEditing(false);
  }, [initialValue]);

  return {
    name,
    editing,
    setName,
    setEditing,

    submit,
    cancel,
    error,
  };
}
