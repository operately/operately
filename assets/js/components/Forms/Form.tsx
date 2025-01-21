import * as React from "react";

import { FormContext } from "./FormContext";
import { FormState } from "./useForm";

export function Form({ form, children }: { form: FormState<any>; children: React.ReactNode }) {
  const action = (e: React.FormEvent) => {
    e.preventDefault();
    form.actions.submit("primary");
  };

  return (
    <FormContext.Provider value={form}>
      <form onSubmit={action}>{children}</form>
    </FormContext.Provider>
  );
}
