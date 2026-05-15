import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Editor, useEditor } from "./index";
import { createMockRichEditorHandlers } from "../utils/storybook/richEditor";
import { PrimaryButton } from "../Button";

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

export const WithLocalDraft: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Direct useEditor consumers should pass a stable localDraft key and clear it only after confirmed save success.",
      },
    },
  },
  render: () => {
    const [savedContent, setSavedContent] = React.useState<any>(null);
    const editor = useEditor({
      placeholder: "Type something, refresh Storybook, and reopen this story...",
      handlers: createMockRichEditorHandlers(),
      localDraft: { key: "storybook:rich-editor:local-draft" },
    });

    const save = async () => {
      setSavedContent(editor.getJson());
      editor.clearLocalDraft();
    };

    return (
      <div className="space-y-3">
        <Editor editor={editor} />
        <PrimaryButton size="sm" onClick={save}>
          Save
        </PrimaryButton>
        {savedContent && <div className="text-xs text-content-dimmed">Saved in story state</div>}
      </div>
    );
  },
};
