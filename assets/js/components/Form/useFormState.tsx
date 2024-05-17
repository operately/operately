import * as React from "react";
import { useNavigate } from "react-router-dom";

type Error = { field: string; message: string };
type Validator<F> = (fields: F) => Error | null;
type Action<F> = [(fields: F) => Promise<void>, boolean];

interface FormState<F> {
  errors: Error[];
  fields: F;
  submit: () => Promise<boolean>;
  submitting: boolean;
}

export function formValidator<F, K extends keyof F>(
  fieldName: K,
  message: string,
  isValid: (value: F[K]) => boolean,
): Validator<F> {
  return (fields: F) => {
    const value = fields[fieldName] as F[K];

    if (!isValid(value)) {
      return { field: fieldName as string, message };
    } else {
      return null;
    }
  };
}

type Mutation = (baseOptions?: {
  onCompleted: (data: any) => void;
}) => [(variables: any) => Promise<any>, { loading: boolean }];

export function useFormMutationAction<F>(props: {
  mutationHook: Mutation;
  variables: (fields: F) => object;
  onCompleted: (data: any, navigate: any) => void;
}): Action<F> {
  const navigate = useNavigate();
  const useMutation = props.mutationHook;

  const [run, { loading: submitting }] = useMutation({
    onCompleted: (data: any) => {
      props.onCompleted(data, navigate);
    },
  });

  const action = async (fields: F): Promise<void> => {
    const variables = props.variables(fields);

    await run({ variables });
  };

  return [action, submitting];
}

interface UseFormStateProps<F> {
  fields: F;
  validations: Validator<F>[];
  action: Action<F>;
}

export function useFormState<F>(props: UseFormStateProps<F>): FormState<F> {
  const [errors, setErrors] = React.useState<Error[]>([]);
  const [action, submitting] = props.action;

  const submit = async (): Promise<boolean> => {
    let errors = props.validations
      .map((validator) => validator(props.fields))
      .filter((error) => error !== null) as Error[];

    if (errors.length > 0) {
      setErrors(errors);
      return false;
    } else {
      await action(props.fields);
      return true;
    }
  };

  return {
    fields: props.fields,
    errors,
    submit,
    submitting,
  };
}
