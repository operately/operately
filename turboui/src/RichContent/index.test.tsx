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
    <RichContent content={content} mentionedPersonLookup={mentionedPersonLookup} parseContent={parseContent} />,
  );
}

function expectMentionContent(container: HTMLElement) {
  expect(container).toHaveTextContent(/Welcome\s+.*Jane\s+to the team\./);
  expect(screen.getByTitle("Jane Doe")).toBeInTheDocument();
}

describe("RichContent", () => {
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
});

describe("Summary", () => {
  it("renders summarized content that includes mentions", async () => {
    const { container } = render(
      <Summary content={contentWithMention} characterCount={200} mentionedPersonLookup={mentionedPersonLookup} />,
    );

    await waitFor(() => {
      expectMentionContent(container);
    });
  });
});
