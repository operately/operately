import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Editor, useEditor } from "./index";
import { createMockRichEditorHandlers } from "../utils/storybook/richEditor";

const meta: Meta<typeof Editor> = {
  title: "Components/RichEditor",
  component: Editor,
  decorators: [
    (Story) => (
      <div className="max-w-4xl mx-auto my-20 bg-surface-base h-[500px] rounded-lg shadow-lg p-12">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof Editor>;

export const Default: Story = {
  render: () => {
    const editor = useEditor({
      placeholder: "Type something...",
      handlers: createMockRichEditorHandlers(),
    });

    return <Editor editor={editor} />;
  },
};

export const WithContent: Story = {
  render: () => {
    const editor = useEditor({
      placeholder: "Type something...",
      content: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "This is a paragraph with some text.",
              },
            ],
          },
        ],
      },
      handlers: createMockRichEditorHandlers(),
    });

    return <Editor editor={editor} />;
  },
};
