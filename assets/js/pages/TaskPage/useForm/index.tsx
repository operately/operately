import * as Tasks from "@/models/tasks";

import { SizeState, useSizeState } from "./useSizeState";
import { PriorityState, usePriorityState } from "./usePriorityState";
import { StatusState, useStatusState } from "./useStatusState";
import { DescriptionState, useDescriptionState } from "./useDescriptionState";
import { NameState, useNameState } from "./useNameState";

export interface FormState {
  name: NameState;
  status: StatusState;
  priority: PriorityState;
  size: SizeState;
  description: DescriptionState;
}

export function useForm(task: Tasks.Task): FormState {
  return {
    name: useNameState(task),
    status: useStatusState(task),
    priority: usePriorityState(task),
    size: useSizeState(task),
    description: useDescriptionState(task),
  };
}
