import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { Page } from "../Page";
import {
  CheckboxInput,
  Form,
  NumberInput,
  PasswordInput,
  RadioButtons,
  Submit,
  TitleInput,
  useForm,
} from "./index";

const meta: Meta = {
  title: "Components/Forms/Inputs",
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div className="sm:mt-12">
        <Page size="medium" title="Form Inputs">
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

export const PasswordInputStory: Story = {
  name: "PasswordInput",
  render: () => {
    function Harness() {
      const form = useForm({
        fields: { password: "" },
        submit: async () => {
          console.log("Submitted:", form.values);
        },
      });

      return (
        <Form form={form}>
          <PasswordInput field="password" label="Password" minLength={8} placeholder="Enter password" />
          <Submit />
        </Form>
      );
    }

    return <Harness />;
  },
};

export const NumberInputStory: Story = {
  name: "NumberInput",
  render: () => {
    function Harness() {
      const form = useForm({
        fields: { port: "587" },
        submit: async () => {
          console.log("Submitted:", form.values);
        },
      });

      return (
        <Form form={form}>
          <NumberInput field="port" label="SMTP Port" placeholder="587" />
          <Submit />
        </Form>
      );
    }

    return <Harness />;
  },
};

export const CheckboxInputStory: Story = {
  name: "CheckboxInput",
  render: () => {
    function Harness() {
      const form = useForm({
        fields: { features: ["notifications"] as string[] },
        submit: async () => {
          console.log("Submitted:", form.values);
        },
      });

      return (
        <Form form={form}>
          <CheckboxInput
            field="features"
            label="Features"
            options={[
              { value: "notifications", label: "Email notifications" },
              { value: "digest", label: "Weekly digest" },
              { value: "alerts", label: "Real-time alerts" },
            ]}
          />
          <Submit />
        </Form>
      );
    }

    return <Harness />;
  },
};

export const RadioButtonsStory: Story = {
  name: "RadioButtons",
  render: () => {
    function Harness() {
      const form = useForm({
        fields: { deliveryMethod: "email" },
        submit: async () => {
          console.log("Submitted:", form.values);
        },
      });

      return (
        <Form form={form}>
          <RadioButtons
            field="deliveryMethod"
            label="Delivery method"
            options={[
              { value: "email", label: "Email" },
              { value: "slack", label: "Slack" },
              { value: "webhook", label: "Webhook" },
            ]}
          />
          <Submit />
        </Form>
      );
    }

    return <Harness />;
  },
};

export const TitleInputStory: Story = {
  name: "TitleInput",
  render: () => {
    function Harness() {
      const form = useForm({
        fields: { title: "Quarterly planning" },
        submit: async () => {
          console.log("Submitted:", form.values);
        },
      });

      return (
        <Form form={form}>
          <TitleInput field="title" placeholder="Enter title" autoFocus />
          <Submit />
        </Form>
      );
    }

    return <Harness />;
  },
};

export const TitleInputReadonly: Story = {
  name: "TitleInput (readonly)",
  render: () => {
    function Harness() {
      const form = useForm({
        fields: { title: "Read-only title" },
        submit: async () => {
          console.log("Submitted:", form.values);
        },
      });

      return (
        <Form form={form}>
          <TitleInput field="title" readonly fontBold />
        </Form>
      );
    }

    return <Harness />;
  },
};
