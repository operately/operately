import { KeyValueMap } from "./FormState";
import { Field } from "./FormState";

type AddErrorFn = (field: string, message: string) => void;

interface FieldSetProps<T extends KeyValueMap> {
  fields: T;
  validate?: (addError: AddErrorFn) => void;
}

export interface FieldSet<T> {
  type: "fieldset";
  fields: T;
  validate: (addError: (field: string, message: string) => void) => void;
  reset: () => void;
}

export function useFieldSet<T extends KeyValueMap>(props: FieldSetProps<T>): FieldSet<T> {
  const fieldset = {
    type: "fieldset" as const,
    validate: createValidator(props),
    fields: props.fields,
    reset: () => {
      for (const key in props.fields) {
        const field = props.fields[key]!;

        if (field.type === "fieldset") {
          const subfieldset = field as FieldSet<any>;
          subfieldset.reset();
        }
      }
    },
  };

  return fieldset;
}

function createValidator<T extends KeyValueMap>(props: FieldSetProps<T>): FieldSet<T>["validate"] {
  return (addError: AddErrorFn) => {
    if (props.validate) {
      props.validate((field, message) => addError(field, message));
    }

    for (const key in props.fields) {
      const field = props.fields[key]!;

      if (field.type === "fieldset") {
        const subfieldset = field as FieldSet<any>;
        subfieldset.validate((field, error) => addError(`${key}.${field}`, error));
      } else {
        const regularField = field as Field<any>;
        const error = regularField.validate();
        if (error) addError(key, error);
      }
    }
  };
}
