import * as React from "react";
import * as Spaces from "@/models/spaces";

import { useNavigateTo } from "@/routes/useNavigateTo";
import { useNavigate } from "react-router-dom";
import { Paths } from "@/routes/paths";

export interface FormState {
  fields: Fields;
  errors: Error[];
  submitting: boolean;

  submit: () => Promise<boolean>;
  cancel: () => void;
}

interface Error {
  field: string;
  message: string;
}

interface Fields {
  space: Spaces.Space;

  name: string;
  purpose: string;

  setName: (name: string) => void;
  setPurpose: (purpose: string) => void;
}

export function useForm(space: Spaces.Space): FormState {
  const [name, setName] = React.useState<string>(space.name!);
  const [purpose, setPurpose] = React.useState<string>(space.mission || "");

  const fields = {
    space,

    name,
    purpose,

    setName,
    setPurpose,
  };

  const [submit, cancel, submitting, errors] = useSubmit(fields);

  return {
    fields,
    errors,
    submitting,
    submit,
    cancel,
  };
}

function useSubmit(fields: Fields): [() => Promise<boolean>, () => void, boolean, Error[]] {
  const navigate = useNavigate();

  const [create, { loading: submitting }] = Spaces.useEditGroupMutation({
    onCompleted: () => navigate(Paths.spacePath(fields.space.id!)),
  });

  const [errors, setErrors] = React.useState<Error[]>([]);

  const submit = async () => {
    const errors = validateForm(fields);

    if (errors.length > 0) {
      setErrors(errors);
      return false;
    }

    await create({
      variables: {
        input: {
          id: fields.space.id,
          name: fields.name,
          mission: fields.purpose,
        },
      },
    });

    return true;
  };

  const cancel = useNavigateTo(Paths.spacePath(fields.space.id!));

  return [submit, cancel, submitting, errors];
}

function validateForm(fields: Fields): Error[] {
  const errors: Error[] = [];

  if (fields.name.length === 0) errors.push({ field: "name", message: "Name is required" });
  if (fields.purpose.length === 0) errors.push({ field: "purpose", message: "Purpose is required" });

  return errors;
}
