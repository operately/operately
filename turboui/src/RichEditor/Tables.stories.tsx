import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";
import { Editor, useEditor } from ".";
import RichContent from "../RichContent";
import { PageDescription } from "../PageDescription";
import { createMockRichEditorHandlers } from "../utils/storybook/richEditor";
import fixtures from "../../../app/test/fixtures/rich_text/tables.json";

const handlers = createMockRichEditorHandlers();
const content = fixtures[0]?.document;
const meta: Meta = {
  title: "Components/RichEditor/Tables",
  decorators: [
    (Story) => (
      <div className="max-w-3xl mx-auto p-6 bg-surface-base text-content-base">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj;

function TableEditor() {
  const editor = useEditor({ content, handlers });
  return <Editor editor={editor} />;
}

export const Editable: Story = { render: () => <TableEditor /> };

export const ReadOnly: Story = {
  render: () => (
    <RichContent
      content={content}
      mentionedPersonLookup={handlers.mentionedPersonLookup}
      taskList={{ canEdit: false }}
    />
  ),
};

export const Narrow: Story = {
  render: () => (
    <div className="w-48">
      <RichContent
        content={content}
        mentionedPersonLookup={handlers.mentionedPersonLookup}
        taskList={{ canEdit: false }}
      />
    </div>
  ),
};

export const SaveAndCancel: Story = {
  render: () => {
    const [description, setDescription] = React.useState(content);
    return (
      <PageDescription
        description={description}
        label="Description"
        canEdit
        richTextHandlers={{ ...handlers, taskList: { canEdit: false }, onCommentTaskItemChange: null }}
        onDescriptionChange={async (value) => {
          setDescription(value);
          return true;
        }}
      />
    );
  },
};
