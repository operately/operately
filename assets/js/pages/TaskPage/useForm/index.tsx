import * as Tasks from "@/models/tasks";

import { NameState, useNameState } from "./useNameState";

export interface FormState {
  name: NameState;
}

export function useForm(task: Tasks.Task): FormState {
  const name = useNameState(task);

  return {
    name,
  };
}
