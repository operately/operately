import * as React from "react";

import { FormContext } from "./FormContext";
import { FormState } from "./FormState";

export function Form({ form, children }: { form: FormState<any>; children: React.ReactNode }) {
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.validate()) return;

    form.setState("submitting");
    await form.submit(form);
    form.setState("idle");
  };

  return (
    <FormContext.Provider value={form}>
      <form onSubmit={onSubmit}>{children}</form>
    </FormContext.Provider>
  );
}
