import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { Page } from "../Page";
import { FieldGroup, Form, Submit, TextInput, useForm } from "./index";

const meta: Meta = {
  title: "Components/Forms/FieldGroup",
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div className="sm:mt-12">
        <Page size="medium" title="FieldGroup Layouts">
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

export const Vertical: Story = {
  render: () => {
    function Harness() {
      const form = useForm({
        fields: { host: "", port: "" },
        submit: async () => {
          console.log("Submitted:", form.values);
        },
      });

      return (
        <Form form={form}>
          <FieldGroup>
            <TextInput field="host" label="Host" placeholder="smtp.example.com" />
            <TextInput field="port" label="Port" placeholder="587" />
          </FieldGroup>
          <Submit />
        </Form>
      );
    }

    return <Harness />;
  },
};

export const Horizontal: Story = {
  render: () => {
    function Harness() {
      const form = useForm({
        fields: { host: "", port: "" },
        submit: async () => {
          console.log("Submitted:", form.values);
        },
      });

      return (
        <Form form={form}>
          <FieldGroup layout="horizontal" layoutOptions={{ ratio: "1:3", dividers: true }}>
            <TextInput field="host" label="Host" placeholder="smtp.example.com" />
            <TextInput field="port" label="Port" placeholder="587" />
          </FieldGroup>
          <Submit />
        </Form>
      );
    }

    return <Harness />;
  },
};

export const Grid: Story = {
  render: () => {
    function Harness() {
      const form = useForm({
        fields: {
          smtpHost: "",
          smtpPort: "",
          smtpUsername: "",
          smtpPassword: "",
        },
        submit: async () => {
          console.log("Submitted:", form.values);
        },
      });

      return (
        <Form form={form}>
          <FieldGroup layout="grid" layoutOptions={{ columns: 2 }}>
            <TextInput field="smtpHost" label="Host" placeholder="smtp.example.com" />
            <TextInput field="smtpPort" label="Port" placeholder="587" />
            <TextInput field="smtpUsername" label="Username" placeholder="user@example.com" />
            <TextInput field="smtpPassword" label="Password" placeholder="••••••••" />
          </FieldGroup>
          <Submit />
        </Form>
      );
    }

    return <Harness />;
  },
};
