import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";

import RichContent from "./index";
import { Summary } from "./Summary";
import { MentionedPersonLookupFn } from "../RichEditor/useEditor";

const mentionedPersonLookup: MentionedPersonLookupFn = async (id) => ({
  id,
  fullName: "Jane Doe",
  avatarUrl: null,
  title: "Engineer",
  profileLink: `/people/${id}`,
});

const contentWithMention = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Welcome " },
        { type: "mention", attrs: { id: "jane-doe-abc123", label: "Jane Doe" } },
        { type: "text", text: " to the team." },
      ],
    },
  ],
};

const plainContent = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [{ type: "text", text: "Plain discussion body." }],
    },
  ],
};

function renderRichContent(content: unknown, parseContent = false) {
  return render(
    <RichContent
      taskList={{ canEdit: false }}
      content={content}
      mentionedPersonLookup={mentionedPersonLookup}
      parseContent={parseContent}
    />,
  );
}

function expectMentionContent(container: HTMLElement) {
  expect(container).toHaveTextContent(/Welcome\s+.*Jane\s+to the team\./);
  expect(screen.getByTitle("Jane Doe")).toBeInTheDocument();
}

describe("RichContent", () => {
  it("refreshes read-only tables without discarding stored widths or attachments", async () => {
    const tableContent = (text: string) => ({
      type: "doc",
      content: [
        {
          type: "table",
          content: [
            {
              type: "tableRow",
              content: [
                {
                  type: "tableCell",
                  attrs: { colwidth: [160] },
                  content: [
                    {
                      type: "paragraph",
                      content: [
                        { type: "text", text },
                        {
                          type: "blob",
                          attrs: { src: "/diagram.png", alt: "Diagram", filetype: "image/png", status: "uploaded" },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
    const { rerender, container } = renderRichContent(plainContent);
    for (const text of ["First version", "Refreshed version"]) {
      rerender(
        <RichContent
          content={tableContent(text)}
          taskList={{ canEdit: false }}
          mentionedPersonLookup={mentionedPersonLookup}
        />,
      );
      await waitFor(() => expect(screen.getByRole("cell")).toHaveTextContent(text));
      expect(screen.getByRole("img", { name: "Diagram" })).toHaveAttribute("src", "/diagram.png");
      expect(container.querySelector("col")).toHaveStyle({ width: "160px" });
      expect(container.querySelector('[contenteditable="true"]')).toBeNull();
    }
    expect(container).not.toHaveTextContent("First version");
  });

  it("keeps unresolved URLs and synchronizes content", async () => {
    const href = `${window.location.origin}/acme-0abc/projects/website-xyz`;
    const content = {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: href, marks: [{ type: "link", attrs: { href } }] }] },
      ],
    };
    const { rerender, container } = render(
      <RichContent taskList={{ canEdit: false }} content={content} mentionedPersonLookup={mentionedPersonLookup} />,
    );

    expect(await screen.findByRole("link", { name: href })).toHaveAttribute("href", href);

    rerender(
      <RichContent
        taskList={{ canEdit: false }}
        content={plainContent}
        mentionedPersonLookup={mentionedPersonLookup}
      />,
    );
    await waitFor(() => expect(container).toHaveTextContent("Plain discussion body."));
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("renders plain text content", async () => {
    const { container } = renderRichContent(plainContent);

    await waitFor(() => {
      expect(container).toHaveTextContent("Plain discussion body.");
    });
  });

  it("renders mention nodes when only mentionedPersonLookup is provided", async () => {
    const { container } = renderRichContent(contentWithMention);

    await waitFor(() => {
      expectMentionContent(container);
    });
  });

  it("renders mention nodes from a serialized JSON string", async () => {
    const { container } = renderRichContent(JSON.stringify(contentWithMention), true);

    await waitFor(() => {
      expectMentionContent(container);
    });
  });

  it("renders resolved resource titles in read mode without changing the destination", async () => {
    const href = `${window.location.origin}/acme-0abc/projects/website-xyz?tab=overview`;
    const content = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Website",
              marks: [{ type: "link", attrs: { href } }],
            },
          ],
        },
      ],
    };

    renderRichContent(content);

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Website" })).toHaveAttribute("href", href);
    });
  });
});

describe("Summary", () => {
  it("summarizes backend-resolved titles", async () => {
    const href = `${window.location.origin}/acme-0abc/projects/a-very-long-project-name-xyz`;
    const content = {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Website", marks: [{ type: "link", attrs: { href } }] }] },
      ],
    };
    const { findByText } = render(
      <Summary content={content} characterCount={10} mentionedPersonLookup={mentionedPersonLookup} />,
    );
    expect(await findByText("Website")).toBeInTheDocument();
  });

  it("renders summarized content that includes mentions", async () => {
    const { container } = render(
      <Summary content={contentWithMention} characterCount={200} mentionedPersonLookup={mentionedPersonLookup} />,
    );

    await waitFor(() => {
      expectMentionContent(container);
    });
  });

  it("renders an image thumbnail for attached files", async () => {
    const content = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "See attached" }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "blob",
              attrs: {
                src: "https://example.com/photo.png",
                alt: "photo.png",
                title: "photo.png",
                filetype: "image/png",
                filesize: 2048,
                status: "uploaded",
              },
            },
          ],
        },
      ],
    };

    render(<Summary content={content} characterCount={200} mentionedPersonLookup={mentionedPersonLookup} />);

    await waitFor(() => {
      expect(screen.getByRole("img", { name: "photo.png" })).toHaveAttribute("src", "https://example.com/photo.png");
    });
  });

  it("still shows a file preview when the text is truncated", async () => {
    const content = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "A".repeat(80) }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "blob",
              attrs: {
                src: "https://example.com/notes.pdf",
                alt: "notes.pdf",
                title: "notes.pdf",
                filetype: "application/pdf",
                filesize: 1024,
                status: "uploaded",
              },
            },
          ],
        },
      ],
    };

    render(<Summary content={content} characterCount={20} mentionedPersonLookup={mentionedPersonLookup} />);

    await waitFor(() => {
      expect(screen.getByText("notes.pdf")).toBeInTheDocument();
    });
  });
});
