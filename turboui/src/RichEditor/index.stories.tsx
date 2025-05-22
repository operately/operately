import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { genPeople } from "../utils/storybook/genPeople";
import { Editor, MentionedPersonLookupFn, useEditor } from "./index";

const people = genPeople(10);

const mockMentionedPersonLookup: MentionedPersonLookupFn = async (id) => {
  const person = people.find((p) => p.id === id);
  return person || null;
};

const mockPeopleSearch = async ({ query }: { query: string }) => {
  if (!query) return people;
  return people.filter((p) => p.fullName.toLowerCase().includes(query.toLowerCase()));
};
const mockUploadFile = async (_file, onProgress) => {
  onProgress(100);
  return { id: "1", url: "https://example.com/file.png" };
};

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
      mentionedPersonLookup: mockMentionedPersonLookup,
      peopleSearch: mockPeopleSearch,
      uploadFile: mockUploadFile,
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
      mentionedPersonLookup: mockMentionedPersonLookup,
      peopleSearch: mockPeopleSearch,
      uploadFile: mockUploadFile,
    });

    return <Editor editor={editor} />;
  },
};
