import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Page } from "../Page";
import RichContent from "./index";

const meta: Meta<typeof RichContent> = {
  title: "Components/RichContent",
  component: RichContent,
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    content: { control: "object" },
    className: { control: "text" },
  },
  decorators: [
    (Story) => (
      <div className="sm:mt-12">
        <Page size="medium" title={"Rich Content Examples"}>
          <div className="p-12">
            <Story />
          </div>
        </Page>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof RichContent>;

// Example of a simple paragraph
const simpleParagraphContent = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [{ type: "text", text: "This is a simple paragraph of text rendered with the RichContent component." }],
    },
  ],
};

// Example with multiple paragraphs and formatting
const formattedContent = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        { type: "text", text: "This is a paragraph with " },
        { type: "text", marks: [{ type: "bold" }], text: "bold" },
        { type: "text", text: ", " },
        { type: "text", marks: [{ type: "italic" }], text: "italic" },
        { type: "text", text: ", and " },
        { type: "text", marks: [{ type: "bold" }, { type: "italic" }], text: "bold italic" },
        { type: "text", text: " text." },
      ],
    },
    {
      type: "paragraph",
      content: [{ type: "text", text: "This is a second paragraph." }],
    },
  ],
};

// Example with headings and lists
const complexContent = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Sample Heading" }],
    },
    {
      type: "paragraph",
      content: [{ type: "text", text: "Here's a paragraph under a heading." }],
    },
    {
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "First bullet item" }],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Second bullet item" }],
            },
          ],
        },
      ],
    },
  ],
};

// Simple paragraph story
export const SimpleParagraph: Story = {
  args: {
    content: simpleParagraphContent,
  },
};

// Formatted text story
export const FormattedText: Story = {
  args: {
    content: formattedContent,
  },
};

// Complex content story
export const ComplexContent: Story = {
  args: {
    content: complexContent,
  },
};

// Story with custom class
export const WithCustomClass: Story = {
  args: {
    content: formattedContent,
    className: "custom-rich-content p-4 bg-gray-100 rounded",
  },
};

// Empty content
export const EmptyContent: Story = {
  args: {
    content: {
      type: "doc",
      content: [{ type: "paragraph" }],
    },
  },
};

// Content with mentioned people
export const WithMentions: Story = {
  args: {
    content: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "This paragraph mentions " },
            {
              type: "mention",
              attrs: {
                id: "user-1",
                label: "John Doe",
              },
            },
            { type: "text", text: " and " },
            {
              type: "mention",
              attrs: {
                id: "user-2",
                label: "Jane Smith",
              },
            },
            { type: "text", text: " who are working on the project." },
          ],
        },
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Another team member, " },
            {
              type: "mention",
              attrs: {
                id: "user-3",
                label: "Alex Johnson",
              },
            },
            { type: "text", text: ", will join next week." },
          ],
        },
      ],
    },
  },
};
