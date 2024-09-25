import React from "react";

import { hasProperty, getProperty, setProperty } from "dot-prop";
import { FieldObject, FieldValue } from "./field";

export function useFieldValues<T extends FieldObject>(fields: T) {
  const [values, setValues] = React.useState<T>(fields);

  const getValue = (key: string) => {
    if (hasProperty(values, key)) {
      return getProperty(values, key);
    } else {
      throw new Error(`Field ${key} does not exist in form`);
    }
  };

  const setValue = (key: string, value: FieldValue) => {
    setValues((prev) => {
      if (hasProperty(prev, key)) {
        setProperty(prev, key, value);
        return { ...prev };
      } else {
        throw new Error(`Field ${key} does not exist in form`);
      }
    });
  };

  const resetValues = () => setValues(fields);

  return { values, getValue, setValue, resetValues };
}
