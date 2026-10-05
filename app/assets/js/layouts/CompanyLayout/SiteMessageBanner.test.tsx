/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { applyLanguage } from "@/i18n";
import { resolveEffectiveLanguage } from "@/i18n/languages";
import { renderToStaticMarkup } from "react-dom/server";

import { SiteMessageBanner } from "./SiteMessageBanner";
import { useStateWithLocalStorage } from "@/hooks/useStateWithLocalStorage";
import { useCompanyLoaderData } from "@/routes/useCompanyLoaderData";

jest.mock("../../../../../turboui/node_modules/react", () => jest.requireActual("react"));
jest.mock("../../../../../turboui/node_modules/react-i18next", () => jest.requireActual("react-i18next"));
jest.mock("../../../../../turboui/node_modules/i18next", () => jest.requireActual("i18next"));
jest.mock("../../../../../turboui/src/icons", () => ({ IconX: () => null }));

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
  ...jest.requireActual("../../../../../turboui/src/SiteMessageBanner"),
  i18nOptions: jest.requireActual("../../../../../turboui/src/i18nOptions").i18nOptions,
  IconInfoCircleFilled: () => <span>info-icon</span>,
  IconX: () => <span>dismiss-icon</span>,
  RichContent: (props: { content: string; parseContent?: boolean }) => {
    const { content, parseContent } = props;
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
      siteMessages: [
        { id: "message-1", title: "Maintenance", description: richTextDescription("Scheduled downtime tonight") },
      ],
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

afterEach(async () => {
  await applyLanguage("en");
});

test.each([
  [true, "Dispensar mensagem"],
  [false, "Dismiss message"],
])("dismiss respects the company language flag: %s", async (enabled, label) => {
  await applyLanguage(resolveEffectiveLanguage("pt-BR", enabled));

  const setDismissed = jest.fn();
  mockUseStateWithLocalStorage.mockReturnValue([[], setDismissed]);
  mockUseCompanyLoaderData.mockReturnValue({
    siteMessages: [{ id: "message-1", title: "Literal title", description: richTextDescription("Literal body") }],
  });
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

  const container = document.createElement("div");
  const root = createRoot(container);

  try {
    act(() => root.render(<SiteMessageBanner />));

    expect(container.textContent).toContain("Literal title");
    expect(container.textContent).toContain("Literal body");

    const button = container.querySelector("button");

    expect(button?.getAttribute("aria-label")).toBe(label);

    act(() => button?.click());

    const update = setDismissed.mock.calls[0]?.[0];

    expect(update([])).toEqual(["message-1"]);
    expect(update(["message-1"])).toEqual(["message-1"]);
  } finally {
    act(() => root.unmount());
  }
});
