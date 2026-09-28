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

function TableEditor({ compact = false }: { compact?: boolean }) {
  const editor = useEditor({ content, handlers });
  return <Editor editor={editor} compactToolbar={compact} />;
}

function EmptyTableEditor({ compact = false }: { compact?: boolean }) {
  const editor = useEditor({ handlers });
  return <Editor editor={editor} compactToolbar={compact} />;
}

export const Editable: Story = { render: () => <TableEditor /> };
export const HoverInsertion: Story = {
  render: () => <TableEditor />,
  parameters: {
    docs: {
      description: {
        story: "Hover over any table border for 200 ms, then click + to insert a row or column at that boundary.",
      },
    },
  },
};
export const HoverDeletion: Story = {
  render: () => <TableEditor />,
  parameters: {
    docs: {
      description: {
        story:
          "Hover near the left or top edge for 500 ms to reveal row or column actions. Open a menu to highlight its target, add a row or column on either side, or choose Delete and use Undo to restore it.",
      },
    },
  },
};
export const InsertTable: Story = { render: () => <EmptyTableEditor /> };
export const MobileControls: Story = {
  render: () => (
    <div className="max-w-full w-80">
      <EmptyTableEditor compact />
    </div>
  ),
};

function MultipleTablesEditor() {
  const editor = useEditor({
    content: { type: "doc", content: [...(content?.content ?? []), ...(content?.content ?? [])] },
    handlers,
  });
  return <Editor editor={editor} />;
}

export const TableSettings: Story = {
  render: () => <MultipleTablesEditor />,
  parameters: {
    docs: {
      description: {
        story:
          "Each table has a settings cog for its header and deletion. The toolbar Table button always inserts another table, after the current table when the cursor is inside it.",
      },
    },
  },
};

export const NarrowEditable: Story = {
  render: () => (
    <div className="w-80 max-w-full">
      <TableEditor compact />
    </div>
  ),
};

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
