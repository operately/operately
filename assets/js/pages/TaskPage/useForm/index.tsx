import * as Tasks from "@/models/tasks";

import { PriorityState, usePriorityState } from "./usePriorityState";
import { StatusState, useStatusState } from "./useStatusState";
import { NameState, useNameState } from "./useNameState";

export interface FormState {
  name: NameState;
  status: StatusState;
  priority: PriorityState;
}

export function useForm(task: Tasks.Task): FormState {
  return {
    name: useNameState(task),
    status: useStatusState(task),
    priority: usePriorityState(task),
  };
}
