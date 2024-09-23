import * as React from "react";

import { FormContext } from "./FormContext";
import { FormState } from "./useForm";

export function Form({ form, children }: { form: FormState<any>; children: React.ReactNode }) {
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await form.actions.submit();
  };

  return (
    <FormContext.Provider value={form}>
      <form onSubmit={onSubmit}>{children}</form>
    </FormContext.Provider>
  );
}
