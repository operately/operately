import * as Tasks from "@/models/tasks";

import { Fields, useFields } from "./fields";
import { StatusActions, useStatusActions } from "./useStatusActions";
import { HeaderFormState, useHeaderForm } from "./useHeaderForm";
import { DescriptionFormState, useDescriptionState } from "./useDescriptionForm";

export interface FormState {
  fields: Fields;

  headerForm: HeaderFormState;
  descriptionForm: DescriptionFormState;
  statusActions: StatusActions;
}

export function useForm(task: Tasks.Task): FormState {
  const fields = useFields(task);
  const headerForm = useHeaderForm(fields);
  const statusActions = useStatusActions(fields);
  const descriptionForm = useDescriptionState(fields);

  return {
    fields,
    headerForm,
    statusActions,
    descriptionForm,
  };
}
