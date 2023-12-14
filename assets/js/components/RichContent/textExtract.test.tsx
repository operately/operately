import { extract } from "./textExtract";

describe("textExtract", () => {
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
