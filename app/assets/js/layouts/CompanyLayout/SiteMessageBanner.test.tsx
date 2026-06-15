import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { SiteMessageBanner } from "./SiteMessageBanner";
import { useStateWithLocalStorage } from "@/hooks/useStateWithLocalStorage";
import { useCompanyLoaderData } from "@/routes/useCompanyLoaderData";

jest.mock("@/hooks/useRichEditorHandlers", () => ({
  useRichEditorHandlers: () => ({
    mentionedPersonLookup: async () => null,
  }),
}));

jest.mock("@/hooks/useStateWithLocalStorage", () => ({
  useStateWithLocalStorage: jest.fn(),
}));

jest.mock("@/routes/useCompanyLoaderData", () => ({
  useCompanyLoaderData: jest.fn(),
}));

jest.mock("turboui", () => ({
  IconInfoCircleFilled: () => <span>info-icon</span>,
  IconX: () => <span>dismiss-icon</span>,
  RichContent: ({ content, parseContent }: { content: string; parseContent?: boolean }) => {
    const parsed = parseContent ? JSON.parse(content) : content;
    const text = parsed?.content?.[0]?.content?.[0]?.text ?? "";
    return <div>{text}</div>;
  },
}));

const mockUseCompanyLoaderData = useCompanyLoaderData as jest.Mock;
const mockUseStateWithLocalStorage = useStateWithLocalStorage as jest.Mock;

function richTextDescription(text: string) {
  return JSON.stringify({
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text }] }],
  });
}

describe("SiteMessageBanner", () => {
  beforeEach(() => {
    mockUseStateWithLocalStorage.mockReturnValue([[], jest.fn()]);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("renders the first active site message", () => {
    mockUseCompanyLoaderData.mockReturnValue({
      siteMessages: [
        { id: "message-1", title: "Maintenance", description: richTextDescription("Scheduled downtime tonight") },
        { id: "message-2", title: "Second", description: richTextDescription("Another message") },
      ],
    });

    const markup = renderToStaticMarkup(<SiteMessageBanner />);

    expect(markup).toContain("site-message-banner");
    expect(markup).toContain("Maintenance");
    expect(markup).toContain("Scheduled downtime tonight");
    expect(markup).not.toContain("Second");
  });

  it("does not render when all messages are dismissed", () => {
    mockUseCompanyLoaderData.mockReturnValue({
      siteMessages: [{ id: "message-1", title: "Maintenance", description: richTextDescription("Scheduled downtime tonight") }],
    });
    mockUseStateWithLocalStorage.mockReturnValue([["message-1"], jest.fn()]);

    const markup = renderToStaticMarkup(<SiteMessageBanner />);

    expect(markup).toBe("");
  });

  it("shows the next message after the first one was dismissed", () => {
    mockUseCompanyLoaderData.mockReturnValue({
      siteMessages: [
        { id: "message-1", title: "First", description: richTextDescription("First body") },
        { id: "message-2", title: "Second", description: richTextDescription("Second body") },
      ],
    });
    mockUseStateWithLocalStorage.mockReturnValue([["message-1"], jest.fn()]);

    const markup = renderToStaticMarkup(<SiteMessageBanner />);

    expect(markup).toContain("Second");
    expect(markup).not.toContain("First body");
  });

  it("does not render when there are no messages", () => {
    mockUseCompanyLoaderData.mockReturnValue({ siteMessages: [] });

    const markup = renderToStaticMarkup(<SiteMessageBanner />);

    expect(markup).toBe("");
  });
});
