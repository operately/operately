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
  tags: ["autodocs"],
  argTypes: {
    jsonContent: { control: "text" },
    className: { control: "text" },
    skipParse: { control: "boolean" },
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
const simpleParagraphContent = JSON.stringify({
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        { type: "text", text: "This is a simple paragraph of text rendered with the RichContent component." }
      ]
    }
  ]
});

// Example with multiple paragraphs and formatting
const formattedContent = JSON.stringify({
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
        { type: "text", text: " text." }
      ]
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "This is a second paragraph." }
      ]
    }
  ]
});

// Example with headings and lists
const complexContent = JSON.stringify({
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Sample Heading" }]
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Here's a paragraph under a heading." }
      ]
    },
    {
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "First bullet item" }]
            }
          ]
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Second bullet item" }]
            }
          ]
        }
      ]
    }
  ]
});

// Simple paragraph story
export const SimpleParagraph: Story = {
  args: {
    jsonContent: simpleParagraphContent,
  },
};

// Formatted text story
export const FormattedText: Story = {
  args: {
    jsonContent: formattedContent,
  },
};

// Complex content story
export const ComplexContent: Story = {
  args: {
    jsonContent: complexContent,
  },
};

// Story with custom class
export const WithCustomClass: Story = {
  args: {
    jsonContent: formattedContent,
    className: "custom-rich-content p-4 bg-gray-100 rounded",
  },
};

// Empty content
export const EmptyContent: Story = {
  args: {
    jsonContent: JSON.stringify({
      type: "doc",
      content: [{ type: "paragraph" }]
    }),
  },
};
