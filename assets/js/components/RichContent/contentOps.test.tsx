import React from "react";
import { extract, truncate } from "./contentOps";

describe("extract", () => {
  it("returns concatenated text", () => {
    const node = {
      type: {
        name: "paragraph",
      },
      content: [
        {
          type: {
            name: "text",
          },
          text: "Hello ",
        },
        {
          type: {
            name: "text",
          },
          text: "world",
        },
        {
          type: {
            name: "text",
          },
          text: "!",
        },
      ],
    };

    expect(extract(node)).toEqual(["Hello ", "world", "!", " "]);
  });

  it("converts paragraphs to spaces", () => {
    const node = {
      type: {
        name: "doc",
      },
      content: [
        {
          type: {
            name: "paragraph",
          },
          content: [
            {
              type: {
                name: "text",
              },
              text: "Hello ",
            },
            {
              type: {
                name: "text",
              },
              text: "world",
            },
            {
              type: {
                name: "text",
              },
              text: "!",
            },
          ],
        },
        {
          type: {
            name: "paragraph",
          },
          content: [
            {
              type: {
                name: "text",
              },
              text: "Goodbye ",
            },
            {
              type: {
                name: "text",
              },
              text: "world",
            },
            {
              type: {
                name: "text",
              },
              text: "!",
            },
          ],
        },
      ],
    };

    expect(extract(node)).toEqual(["Hello ", "world", "!", " ", "Goodbye ", "world", "!", " "]);
  });

  it("converts mentions to objects", () => {
    const node = {
      type: {
        name: "paragraph",
      },
      content: [
        {
          type: {
            name: "text",
          },
          text: "Hello ",
        },
        {
          type: {
            name: "mention",
          },
          attrs: {
            id: "123",
            label: "world",
          },
        },
        {
          type: {
            name: "text",
          },
          text: "!",
        },
      ],
    };

    expect(extract(node)).toEqual(["Hello ", { id: "123", label: "world" }, "!", " "]);
  });
});

describe("truncate", () => {
  it("truncates text", () => {
    const extracted = ["Hello", "world", "how", "are", "you", "?"];
    const characterCount = 7;

    expect(truncate(extracted, characterCount)).toEqual([
      <React.Fragment key={0}>Hello</React.Fragment>,
      <React.Fragment key={1}>wo</React.Fragment>,
      <React.Fragment key={2}>&hellip;</React.Fragment>,
    ]);
  });

  it("truncates text with mentions", () => {
    const extracted = ["Hello", { id: "123", label: "John Johnson" }, "how", "are", "you", "?"];
    const characterCount = 7;

    expect(truncate(extracted, characterCount)).toEqual([
      <React.Fragment key={0}>Hello</React.Fragment>,
      <span key={1} className="font-medium text-link-base">
        @{"John Johnson"}
      </span>,
      <React.Fragment key={2}>&hellip;</React.Fragment>,
    ]);
  });

  it("if the whole text fits, it doesn't truncate", () => {
    const extracted = ["Hello", "world", "how", "are", "you", "?", { id: "123", label: "John Johnson" }];
    const characterCount = 100;

    expect(truncate(extracted, characterCount)).toEqual([
      <React.Fragment key={0}>Hello</React.Fragment>,
      <React.Fragment key={1}>world</React.Fragment>,
      <React.Fragment key={2}>how</React.Fragment>,
      <React.Fragment key={3}>are</React.Fragment>,
      <React.Fragment key={4}>you</React.Fragment>,
      <React.Fragment key={5}>?</React.Fragment>,
      <span key={6} className="font-medium text-link-base">
        @{"John Johnson"}
      </span>,
    ]);
  });
});
