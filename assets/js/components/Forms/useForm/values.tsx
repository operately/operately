import React from "react";

import { hasProperty, getProperty, setProperty } from "dot-prop";
import { FieldObject, FieldValue } from "./field";

export function useFieldValues<T extends FieldObject>(fields: T, onChange?: (values: T) => void) {
  const [values, setValues] = React.useState<T>(() => {
    if (onChange) onChange(fields);
    return fields;
  });

  const getValue = (key: string) => {
    if (hasProperty(values, key)) {
      return getProperty(values, key);
    } else {
      throw new Error(`Field ${key} does not exist in form`);
    }
  };

  const setValue = (key: string, value: FieldValue) => {
    setValues((prev) => {
      if (!hasProperty(prev, key)) throw new Error(`Field ${key} does not exist in form`);

      setProperty(prev, key, value);
      if (onChange) onChange(prev);

      return { ...prev };
    });
  };

  const resetValues = () => setValues(fields);

  return { values, getValue, setValue, resetValues };
}
