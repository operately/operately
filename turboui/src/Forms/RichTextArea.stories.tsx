import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Page } from "../Page";
import { createMockRichEditorHandlers } from "../utils/storybook/richEditor";
import { emptyContent } from "../RichContent/contentOps";
import { FieldGroup, Form, RichTextArea, Submit, useForm } from "./index";

const meta: Meta = {
  title: "Components/Forms/RichTextArea",
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div className="sm:mt-12">
        <Page size="medium" title="RichTextArea">
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

export const Editable: Story = {
  render: () => {
    function Harness() {
      const richTextHandlers = createMockRichEditorHandlers();
      const form = useForm({
        fields: { description: emptyContent() },
        submit: async () => {
          console.log("Submitted:", form.values);
        },
      });

      return (
        <Form form={form}>
          <FieldGroup>
            <RichTextArea
              field="description"
              label="Description"
              placeholder="Write something..."
              richTextHandlers={richTextHandlers}
              required
            />
          </FieldGroup>
          <Submit saveText="Save" />
        </Form>
      );
    }

    return <Harness />;
  },
};

export const Readonly: Story = {
  render: () => {
    function Harness() {
      const richTextHandlers = createMockRichEditorHandlers();
      const form = useForm({
        fields: {
          description: {
            type: "doc",
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "This content is read-only." }],
              },
            ],
          },
        },
        submit: async () => undefined,
      });

      return (
        <Form form={form}>
          <FieldGroup>
            <RichTextArea
              field="description"
              label="Description"
              richTextHandlers={richTextHandlers}
              readonly
            />
          </FieldGroup>
        </Form>
      );
    }

    return <Harness />;
  },
};

export const StyledDocumentEditor: Story = {
  name: "Document-style (hideBorder)",
  render: () => {
    function Harness() {
      const richTextHandlers = createMockRichEditorHandlers();
      const form = useForm({
        fields: { content: emptyContent() },
        submit: async () => {
          console.log("Submitted:", form.values);
        },
      });

      return (
        <Form form={form}>
          <FieldGroup>
            <RichTextArea
              field="content"
              richTextHandlers={richTextHandlers}
              placeholder="Write here..."
              hideBorder
              showToolbarTopBorder
              fontSize="text-lg"
              horizontalPadding="px-0"
              verticalPadding="pt-2"
              height="min-h-[250px]"
            />
          </FieldGroup>
          <Submit saveText="Publish" />
        </Form>
      );
    }

    return <Harness />;
  },
};
