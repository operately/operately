import { Person } from "@/api";
import * as React from "react";

interface FormState {
  fields: any;
  setValue: (fieldName: string, value: any) => void;
  submit: (form: FormState) => Promise<void>;
}

type BaseField<T> = {
  value: T | null | undefined;
  initial: T | null | undefined;
  optional?: boolean;
};

type TextField = BaseField<string> & {
  type: "text";
};

type SelectField = BaseField<string> & {
  type: "select";
  options: { value: string; label: string }[];
};

type SelectPersonField = BaseField<Person> & {
  type: "select-person";
};

type Field = TextField | SelectField | SelectPersonField;

interface UseFormProps {
  fields: Record<string, Field>;
  submit: (form: FormState) => Promise<void>;
}

const FormContext = React.createContext<FormState | null>(null);

function getFormContext(): FormState {
  const form = React.useContext(FormContext);
  if (!form) throw new Error("Form fields must be used within a Form component");
  return form;
}

function useForm(props: UseFormProps): FormState {
  const [fields, setFields] = React.useState(props.fields);

  const setValue = (fieldName: string, value: any) => {
    const f = fields[fieldName];
    if (!f) throw new Error(`Field ${fieldName} does not exist`);

    setFields((fields) => ({
      ...fields,
      [fieldName]: {
        ...fields[fieldName],
        value: value,
      },
    }));
  };

  return {
    fields: fields,
    setValue: setValue,
    submit: props.submit,
  };
}

function Form({ form, children }: { form: FormState; children: React.ReactNode }) {
  const onSubmit = async () => {
    await form.submit(form);
  };

  return (
    <FormContext.Provider value={form}>
      <form onSubmit={onSubmit}>{children}</form>
    </FormContext.Provider>
  );
}

function TextInput({ field, label }: { field: string; label?: string }) {
  const form = getFormContext();

  if (label) {
    return (
      <div className="flex flex-col gap-0.5">
        <label className="font-bold" htmlFor={field}>
          {label}
        </label>
        <input
          name={field}
          type="text"
          value={form.fields[field].value}
          onChange={(e) => form.setValue(field, e.target.value)}
        />
      </div>
    );
  } else {
    return (
      <div>
        <input
          name={field}
          type="text"
          value={form.fields[field].value}
          onChange={(e) => form.setValue(field, e.target.value)}
        />
      </div>
    );
  }
}

function SelectBox({ field }: { field: string }) {
  const form = getFormContext();

  return (
    <select value={form.fields[field].value} onChange={(e) => form.setValue(field, e.target.value)}>
      {form.fields[field].options.map((option: { value: string; label: string }) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function FieldGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-4">{children}</div>;
}

function Submit() {
  const form = getFormContext();

  return <button type="submit">Submit</button>;
}

interface TextFieldConfig {
  optional?: boolean;
}

function textField(initial: string | null | undefined, config?: TextFieldConfig): TextField {
  return { type: "text", initial, optional: config?.optional, value: initial };
}

interface SelectFieldConfig {
  optional?: boolean;
}

interface SelectFieldOption {
  value: string;
  label: string;
}

function selectField(
  initial: string | null | undefined,
  options: SelectFieldOption[],
  config?: SelectFieldConfig,
): SelectField {
  return { type: "select", initial, options, optional: config?.optional, value: initial };
}

interface SelectPersonFieldConfig {
  optional?: boolean;
}

function selectPersonField(initial: Person | null | undefined, config?: SelectPersonFieldConfig): SelectPersonField {
  return { type: "select-person", initial, optional: config?.optional, value: initial };
}

export default {
  useForm,
  Form,
  TextInput,
  SelectBox,
  FieldGroup,
  Submit,
  textField,
  selectField,
  selectPersonField,
};
