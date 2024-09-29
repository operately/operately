import * as React from "react";
import * as Icons from "@tabler/icons-react";

import { Section, SectionTitle } from "./Section";
import Forms from "@/components/Forms";
import { SecondaryButton } from "@/components/Buttons";

export function FormExamples() {
  return (
    <Section>
      <SectionTitle>Forms</SectionTitle>

      <div className="max-w-2xl mt-2 mb-10">
        The components/Forms directory contains a collection of form-related components that can be used to build forms.
      </div>

      <div className="flex flex-col gap-10">
        <VerticalForm />
        <HorizontalForm />
        <HorizontalFormCustomized />
        <GridForm />
        <ArrayForm />
        <RichTextForm />
      </div>
    </Section>
  );
}

function VerticalForm() {
  const form = Forms.useForm({
    fields: {
      name: "",
      email: "",
      password: "",
    },
    submit: async () => {
      console.log("Form submitted with values:", form);
    },
    cancel: async () => {
      console.log("Form cancelled", form);
    },
  });

  return (
    <div className="p-6 border border-surface-outline rounded shadow-sm">
      <Forms.Form form={form}>
        <div className="mb-4 font-bold text-lg">Vertical layout</div>

        <Forms.FieldGroup>
          <Forms.TextInput field={"name"} label={"Name"} placeholder="e.g. Martin Smith" />
          <Forms.TextInput field={"email"} label={"Email"} placeholder="e.g. martin@acme.org" />
          <Forms.TextInput field={"password"} label={"Password (min 8 characters)"} />
        </Forms.FieldGroup>

        <Forms.Submit saveText="Submit" />
      </Forms.Form>
    </div>
  );
}

function HorizontalForm() {
  const form = Forms.useForm({
    fields: {
      name: "",
      description: "",
    },
    submit: async () => {
      console.log("Form submitted with values:", form);
    },
  });

  return (
    <div className="p-6 border border-surface-outline rounded shadow-sm">
      <Forms.Form form={form}>
        <div className="mb-8 font-bold text-lg">Horizontal layout</div>

        <Forms.FieldGroup layout="horizontal">
          <Forms.TextInput field={"name"} label={"Project Name"} placeholder="e.g. Moonshot" />
          <Forms.TextInput
            field={"description"}
            label={"Description"}
            placeholder="e.g. A new project to explore Mars"
          />
        </Forms.FieldGroup>

        <Forms.Submit saveText="Create Project" />
      </Forms.Form>
    </div>
  );
}

function HorizontalFormCustomized() {
  const form = Forms.useForm({
    fields: {
      company: "view",
      space: "edit",
    },
    submit: async () => {
      console.log("Form submitted with values:", form);
    },
  });

  const options = [
    { value: "view", label: "View Access" },
    { value: "edit", label: "Edit Access" },
  ];

  return (
    <div className="p-6 border border-surface-outline rounded shadow-sm">
      <Forms.Form form={form}>
        <div className="mb-8 font-bold text-lg">Horizontal layout (customized)</div>

        <Forms.FieldGroup layout="horizontal" layoutOptions={{ ratio: "1:1", dividers: true }}>
          <Forms.SelectBox field={"company"} label={"Company Members"} options={options} />
          <Forms.SelectBox field={"space"} label={"Space Members"} options={options} />
        </Forms.FieldGroup>

        <Forms.Submit saveText="Create Project" />
      </Forms.Form>
    </div>
  );
}

function GridForm() {
  const form = Forms.useForm({
    fields: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    submit: async () => {
      console.log("Form submitted with values:", form);
    },
  });

  return (
    <div className="p-6 border border-surface-outline rounded shadow-sm">
      <Forms.Form form={form}>
        <div className="mb-4 font-bold text-lg">Grid layout form</div>

        <Forms.FieldGroup layout="grid">
          <Forms.TextInput field={"name"} label={"Name"} placeholder="e.g. Martin Smith" />
          <Forms.TextInput field={"email"} label={"Email"} placeholder="e.g. martin@acme.org" />
          <Forms.PasswordInput field={"password"} label={"Password"} />
          <Forms.PasswordInput field={"confirmPassword"} label={"Confirm Password"} />
        </Forms.FieldGroup>

        <Forms.Submit saveText="Submit" />
      </Forms.Form>
    </div>
  );
}

function RichTextForm() {
  const form = Forms.useForm({
    fields: {
      name: "",
      description: null,
    },
    submit: async () => {
      console.log("Form submitted with values:", form.values.description);
    },
  });

  return (
    <div className="p-6 border border-surface-outline rounded shadow-sm">
      <Forms.Form form={form}>
        <div className="mb-4 font-bold text-lg">Rich Text Form</div>

        <Forms.FieldGroup>
          <Forms.TextInput field={"name"} label={"Name"} placeholder="e.g. Project Orion" />
          <Forms.RichTextArea
            field={"description"}
            label={"Description"}
            placeholder="e.g. A new project to explore Mars"
          />
        </Forms.FieldGroup>

        <Forms.Submit saveText="Submit" />
      </Forms.Form>
    </div>
  );
}

function ArrayForm() {
  const form = Forms.useForm({
    fields: {
      people: [{ name: "", email: "" }],
    },
    submit: async () => {
      console.log("Form submitted with values:", form);
    },
  });

  return (
    <div className="p-6 border border-surface-outline rounded shadow-sm">
      <Forms.Form form={form}>
        <div className="mb-4 font-bold text-lg">Form example with add more button</div>

        <div className="mb-4">
          {form.values.people.map((_, index) => (
            <div className="flex justify-between items-center gap-4 mb-4" key={index}>
              <div className="w-[calc(100%-40px)]">
                <Forms.FieldGroup layout="grid">
                  <Forms.TextInput field={`people[${index}].name`} label={"Name"} placeholder="e.g. Martin Smith" />
                  <Forms.TextInput
                    field={`people[${index}].email`}
                    label={"Email"}
                    placeholder="e.g. martin@acme.org"
                  />
                </Forms.FieldGroup>
              </div>

              <Remove index={index} />
            </div>
          ))}
        </div>

        <AddMoreButton />

        <Forms.Submit saveText="Submit" />
      </Forms.Form>
    </div>
  );
}

function AddMoreButton() {
  const [value, setValue] = Forms.useFieldValue<{ name: string; email: string }[]>("people");

  const onClick = () => {
    setValue([...value, { name: "", email: "" }]);
  };

  return (
    <SecondaryButton size="xxs" onClick={onClick}>
      Add more
    </SecondaryButton>
  );
}

function Remove({ index }: { index: number }) {
  const [value, setValue] = Forms.useFieldValue<{ name: string; email: string }[]>("people");

  const onClick = () => {
    const newValue = value.filter((_, i) => i !== index);
    setValue(newValue);
  };

  return <Icons.IconTrash onClick={onClick} className="cursor-pointer mt-6" size={20} />;
}
