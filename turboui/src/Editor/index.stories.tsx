import type { Meta, StoryObj } from "@storybook/react";
import { Editor, useEditor } from ".";
import { genPeople } from "../utils/storybook/genPeople";

const meta = {
  title: "Components/Editor",
  component: Editor,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-[700px] p-4 border border-gray-200 rounded">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Editor>;

export default meta;
type Story = StoryObj<typeof EditorWithHooks>;

const EditorWithHooks = (args) => {
  const peopleSearch = async () => genPeople(10);
  const editor = useEditor({ peopleSearch});

  return <Editor editor={editor} placeholder={args.placeholder} />
};

export const Default: Story = {
  render: (args) => <EditorWithHooks {...args} />,
};
