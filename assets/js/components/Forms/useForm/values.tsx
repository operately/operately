import React from "react";

import { hasProperty, getProperty, setProperty } from "dot-prop";
import { FieldObject, FieldValue } from "./field";

export type OnChangeFn<T extends FieldObject> = ({ newValues, field }: { newValues: T; field: string | null }) => void;

export function useFieldValues<T extends FieldObject>(fields: T, onChange?: OnChangeFn<T>) {
  const [values, setValues] = React.useState<T>(() => {
    if (onChange) onChange({ newValues: fields, field: null });

    return fields;
  });

  const getValue = (key: string) => {
    if (hasProperty(values, key)) {
      return getProperty(values, key);
    } else {
      throw new Error(`Field ${key} does not exist in form. Available fields: ${Object.keys(values).join(", ")}`);
    }
  };

  const setValue = (key: string, value: FieldValue) => {
    setValues((prev) => {
      if (!hasProperty(prev, key)) throw new Error(`Field ${key} does not exist in form`);

      setProperty(prev, key, value);
      if (onChange) onChange({ newValues: prev, field: key });

      return { ...prev };
    });
  };

  const resetValues = () => setValues(fields);

  return { values, getValue, setValue, resetValues };
}
