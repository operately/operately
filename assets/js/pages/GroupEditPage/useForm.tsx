import * as React from "react";
import * as Groups from "@/models/groups";

import { createPath } from "@/utils/paths";
import { useNavigateTo } from "@/routes/useNavigateTo";
import { useNavigate } from "react-router-dom";

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
  group: Groups.Group;

  name: string;
  purpose: string;

  setName: (name: string) => void;
  setPurpose: (purpose: string) => void;
}

export function useForm(group: Groups.Group): FormState {
  const [name, setName] = React.useState<string>(group.name);
  const [purpose, setPurpose] = React.useState<string>(group.mission || "");

  const fields = {
    group,

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

  const [create, { loading: submitting }] = Groups.useEditGroupMutation({
    onCompleted: () => navigate(createPath("spaces", fields.group.id)),
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
          name: fields.name,
          mission: fields.purpose,
        },
      },
    });

    return true;
  };

  const cancel = useNavigateTo(createPath("spaces", fields.group.id));

  return [submit, cancel, submitting, errors];
}

function validateForm(fields: Fields): Error[] {
  const errors: Error[] = [];

  if (fields.name.length === 0) errors.push({ field: "name", message: "Name is required" });
  if (fields.purpose.length === 0) errors.push({ field: "purpose", message: "Purpose is required" });

  return errors;
}
