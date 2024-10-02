import * as React from "react";

import { FormContext } from "./FormContext";
import { FormState } from "./useForm";

export function Form({ form, children }: { form: FormState<any>; children: React.ReactNode }) {
  return (
    <FormContext.Provider value={form}>
      <form>{children}</form>
    </FormContext.Provider>
  );
}
