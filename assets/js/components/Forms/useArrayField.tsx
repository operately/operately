import * as React from "react";
import { Field } from "./FormState";

type AddErrorFn = (field: string, message: string) => void;

interface ArrayFieldProps {
  fields: Field[];
  validate?: (addError: AddErrorFn) => void;
}

export interface ArrayField extends Field {
  type: "arrayfield";
  fields: Field[];
  validate: (addError: (field: string, message: string) => void) => void;
  reset: () => void;
}

export function useArrayField(props: ArrayFieldProps): ArrayField {
  const [fieldName, setFieldName] = React.useState<string | undefined>(undefined);

  const setSubFieldNames = (name: string) => {
    setFieldName(name);

    for (let i = 0; i < props.fields.length; i++) {
      for (const key in props.fields[i]!) {
        props.fields[i]![key]!.setFieldName(`${fieldName}.${i}.${key}`);
      }
    }
  };

  const field = {
    type: "arrayfield" as const,
    validate: createValidator(props),
    fields: props.fields,
    reset: () => {
      for (let i = 0; i < props.fields.length; i++) {
        props.fields[i]!.reset();
      }
    },
    fieldName,
    setFieldName: setSubFieldNames,
  };

  return field;
}

function createValidator(props: ArrayFieldProps): ArrayField["validate"] {
  return (addError: AddErrorFn) => {
    if (props.validate) {
      props.validate((field, message) => addError(field, message));
    }

    for (const key in props.fields) {
      const field = props.fields[key]!;
      field.validate(addError);
    }
  };
}
