import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Page } from "../Page";
import { FieldGroup, Form, FormError, Submit, TextInput, useForm } from "./index";

const meta: Meta = {
  title: "Components/Forms/Forms",
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div className="sm:mt-12">
        <Page size="medium" title="Forms">
          <div className="p-12">
            <Story />
          </div>
        </Page>
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj;

export const BasicForm: Story = {
  render: () => {
    function Harness() {
      const form = useForm({
        fields: { companyName: "", domain: "" },
        submit: async () => {
          console.log("Submitted:", form.values);
        },
      });

      return (
        <Form form={form}>
          <FieldGroup>
            <TextInput field="companyName" label="Company name" required placeholder="Acme Inc." autoFocus />
            <TextInput field="domain" label="Domain" placeholder="acme.com" />
          </FieldGroup>
          <Submit saveText="Create company" />
        </Form>
      );
    }

    return <Harness />;
  },
};

export const ValidationErrors: Story = {
  render: () => {
    function Harness() {
      const form = useForm({
        fields: { email: "", password: "short" },
        submit: async () => {
          console.log("Submitted:", form.values);
        },
      });

      return (
        <Form form={form}>
          <FieldGroup>
            <TextInput field="email" label="Email" required placeholder="name@company.com" />
            <TextInput field="password" label="Password" minLength={12} okSign placeholder="At least 12 characters" />
          </FieldGroup>
          <FormError className="mt-4" />
          <Submit saveText="Save changes" />
        </Form>
      );
    }

    return <Harness />;
  },
};

export const CancelFlow: Story = {
  render: () => {
    function Harness() {
      const [status, setStatus] = React.useState("No cancel yet");
      const form = useForm({
        fields: { title: "Quarterly planning" },
        cancel: async () => {
          setStatus("Cancel callback invoked");
        },
        submit: async () => {
          console.log("Submitted:", form.values);
        },
      });

      return (
        <Form form={form}>
          <TextInput field="title" label="Title" />
          <div className="mt-3 text-sm text-content-subtle">{status}</div>
          <Submit saveText="Save" cancelText="Discard" />
        </Form>
      );
    }

    return <Harness />;
  },
};

export const NestedPaths: Story = {
  render: () => {
    function Harness() {
      const form = useForm({
        fields: {
          settings: {
            smtp: [{ host: "smtp.example.com", port: "587" }],
          },
        },
        submit: async () => {
          console.log("Submitted:", form.values);
        },
      });

      return (
        <Form form={form}>
          <FieldGroup layout="horizontal" layoutOptions={{ ratio: "1:1", dividers: true }}>
            <TextInput field="settings.smtp[0].host" label="SMTP host" />
            <TextInput field="settings.smtp[0].port" label="SMTP port" />
          </FieldGroup>
          <Submit saveText="Save settings" submitOnEnter />
        </Form>
      );
    }

    return <Harness />;
  },
};
