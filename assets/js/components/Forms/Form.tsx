import * as React from "react";

import { FormContext } from "./FormContext";
import { FormState } from "./useForm";

interface Props {
  form: FormState<any>;
  children: React.ReactNode;
  testId?: string;
  preventSubmitOnEnter?: boolean;
}

export function Form({ form, children, testId, preventSubmitOnEnter }: Props) {
  const action = (e: React.FormEvent) => {
    e.preventDefault();
    if (!preventSubmitOnEnter) {
      form.actions.submit("primary");
    }
  };

  return (
    <FormContext.Provider value={form}>
      <form data-test-id={testId} onSubmit={action}>
        {children}
      </form>
    </FormContext.Provider>
  );
}
