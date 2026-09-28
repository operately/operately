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
export const ActiveTableControls: Story = {
  render: () => <TableEditor />,
  parameters: {
    docs: {
      description: {
        story:
          "Place the cursor in a table to show row, column, and settings controls. Hover or focus an action to preview its effect.",
      },
    },
  },
};
export const CellMenu: Story = {
  render: () => <TableEditor />,
  parameters: {
    docs: {
      description: {
        story:
          "Right-click a cell or press Shift+F10 to open its actions. Alt+F10 focuses the table controls. The cog also offers all insertion directions for touch users.",
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
          "Only the active table shows controls for its rows, columns, header, and deletion. The toolbar Table button always inserts another table, after the current table when the cursor is inside it.",
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

const widthExamples = {
  type: "doc",
  content: [false, true].map((bothLong) => ({
    type: "table",
    content: [
      {
        type: "tableRow",
        content: ["A", "B"].map((text) => ({
          type: "tableHeader",
          content: [{ type: "paragraph", content: [{ type: "text", text }] }],
        })),
      },
      ...[0, 1].map((row) => ({
        type: "tableRow",
        content: [
          bothLong && row === 1 ? "Very long sentence bla bla bla bla bla" : "1 word",
          "Very long sentence bla bla bla bla bla",
        ].map((text) => ({ type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text }] }] })),
      })),
    ],
  })),
};

function WidthExamples({ readonly = false }: { readonly?: boolean }) {
  const state = useEditor({ content: widthExamples, handlers });
  return readonly ? (
    <RichContent
      content={widthExamples}
      mentionedPersonLookup={handlers.mentionedPersonLookup}
      taskList={{ canEdit: false }}
    />
  ) : (
    <Editor editor={state} />
  );
}
export const ContentAwareWidths: Story = { render: () => <WidthExamples /> };
export const ReadOnlyWidths: Story = { render: () => <WidthExamples readonly /> };
