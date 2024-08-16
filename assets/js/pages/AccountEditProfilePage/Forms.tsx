import * as React from "react";

import { FormState, Field, useTextField, useSelectField, useSelectPersonField } from "./FormState";
import { FormContext, getFormContext } from "./FormContext";
import { TextInput } from "./TextInput";
import { FieldGroup } from "./FieldGroup";
import { SelectBox } from "./SelectBox";
import { FilledButton } from "@/components/Button";

interface UseFormProps {
  fields: Record<string, Field>;
  submit: (form: FormState) => Promise<void>;
}

function useForm(props: UseFormProps): FormState {
  const [state, setState] = React.useState<"idle" | "submitting">("idle");
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const clearErrors = () => setErrors({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    for (const key in props.fields) {
      const field = props.fields[key]!;
      const error = field.validate();

      if (error) {
        newErrors[key] = error;
      }
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  return {
    state: state,
    fields: props.fields,
    errors,
    setErrors,
    clearErrors,
    validate,
    setState,
    submit: props.submit,
  };
}

function Form({ form, children }: { form: FormState; children: React.ReactNode }) {
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

function Submit({ saveText }: { saveText: string }) {
  const form = getFormContext();

  return (
    <div className="flex items-center gap-2 mt-8">
      <FilledButton type="primary" submit loading={form.state === "submitting"}>
        {saveText}
      </FilledButton>
    </div>
  );
}

export default {
  useForm,
  Form,
  TextInput,
  SelectBox,
  FieldGroup,
  Submit,
  useTextField,
  useSelectField,
  useSelectPersonField,
};
