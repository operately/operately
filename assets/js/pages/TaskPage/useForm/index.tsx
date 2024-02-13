import * as Tasks from "@/models/tasks";

import { StatusState, useStatusState } from "./useStatusState";
import { NameState, useNameState } from "./useNameState";

export interface FormState {
  name: NameState;
  status: StatusState;
}

export function useForm(task: Tasks.Task): FormState {
  return {
    name: useNameState(task),
    status: useStatusState(task),
  };
}
