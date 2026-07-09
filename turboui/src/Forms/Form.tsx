import * as React from "react";

import { FormsProvider } from "./context";
import type { FormProps, FormValues } from "./types";

export function Form<T extends FormValues>({ form, testId, children, preventSubmitOnEnter }: FormProps<T>) {
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!preventSubmitOnEnter) {
      await form.actions.submit();
    }
  };

  return (
    <FormsProvider form={form as FormProps<FormValues>["form"]}>
      <form data-test-id={testId} onSubmit={handleSubmit}>
        {children}
      </form>
    </FormsProvider>
  );
}
