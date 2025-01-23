import * as React from "react";

import { FormContext } from "./FormContext";
import { FormState } from "./useForm";

export function Form({ form, children, testId }: { form: FormState<any>; children: React.ReactNode; testId?: string }) {
  const action = (e: React.FormEvent) => {
    e.preventDefault();
    form.actions.submit("primary");
  };

  return (
    <FormContext.Provider value={form}>
      <form data-test-id={testId} onSubmit={action}>
        {children}
      </form>
    </FormContext.Provider>
  );
}
