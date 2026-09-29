/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { i18n, applyLanguage, setupTestCatalog } from "@/__tests__/i18n";
import { resolveEffectiveLanguage } from "@/i18n/languages";
import page from ".";
import { useLoadedData } from "./loader";

jest.mock("./loader", () => ({ loader: jest.fn(), useLoadedData: jest.fn() }));
jest.mock("@/components/Pages", () => ({
  Page: ({ children, title }) => <main aria-label={title.join(" / ")}>{children}</main>,
}));
jest.mock("@/components/PaperContainer", () => ({
  Root: ({ children }) => children,
  Body: ({ children }) => children,
  Navigation: () => null,
  Header: ({ title, actions }) => (
    <header>
      <h1>{title}</h1>
      {actions}
    </header>
  ),
}));
jest.mock("@/models/discussions", () => ({ useArchiveMessage: () => ({ mutateAsync: jest.fn() }) }));
jest.mock("@/hooks/useFormattedTimePreferences", () => ({ useFormattedTimePreferences: () => ({}) }));
jest.mock("react-router", () => ({ useNavigate: () => jest.fn() }));
jest.mock("@/routes/paths", () => ({
  usePaths: () => ({
    spacePath: () => "/space",
    spaceDiscussionsPath: () => "/discussions",
    discussionNewPath: () => "/new",
    discussionEditPath: () => "/edit",
    discussionDraftsPath: () => "/drafts",
  }),
}));
jest.mock("turboui", () => ({
  PrimaryButton: ({ children, linkTo }) => <a href={linkTo}>{children}</a>,
  DivLink: ({ children, to }) => <a href={to}>{children}</a>,
  Menu: ({ customTrigger, children }) => (
    <div>
      {customTrigger}
      {children}
    </div>
  ),
  MenuActionItem: ({ children }) => <button>{children}</button>,
  IconDots: () => null,
  Avatar: () => null,
  FormattedTime: () => <time>formatted date</time>,
  DiscardDiscussionDraftModal: () => null,
  richContentToString: () => "User-authored body",
}));

setupTestCatalog();
let root: Root;
let container: HTMLDivElement;

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  root = createRoot(container);
  jest
    .mocked(useLoadedData)
    .mockReturnValue({ space: { __typename: "space", id: "space-1", name: "User-authored space" }, myDrafts: [] });
});
afterEach(() => act(() => root.unmount()));

it.each(["flag-off", "missing-portuguese", "substituted"])(
  "renders the draft empty state from the catalog: %s",
  async (mode) => {
    if (mode === "missing-portuguese") i18n.removeResourceBundle("pt-BR", "translation");
    if (mode === "substituted")
      i18n.addResourceBundle(
        "en",
        "translation",
        {
          "Your Drafts": "Expanded translated discussion drafts heading",
          "You don't have any drafts.": "Translated empty discussion drafts",
          "New Discussion": "Translated new discussion",
        },
        true,
        true,
      );
    await applyLanguage(resolveEffectiveLanguage("pt-BR", mode === "missing-portuguese"));
    act(() => root.render(<page.Page />));
    expect(container.querySelector("h1")?.textContent).toBe(
      mode === "substituted" ? "Expanded translated discussion drafts heading" : "Your Drafts",
    );
    expect(container.textContent).toContain(
      mode === "substituted" ? "Translated empty discussion drafts" : "You don't have any drafts.",
    );
    expect(container.querySelector('a[href="/new"]')?.textContent).toBe(
      mode === "substituted" ? "Translated new discussion" : "New Discussion",
    );
    expect(container.querySelector("main")?.getAttribute("aria-label")).toContain("User-authored space");
  },
);

it("looks up draft action accessibility and metadata without translating content", async () => {
  i18n.addResourceBundle(
    "en",
    "translation",
    {
      "Draft actions": "Translated draft actions",
      "Last edited on <date/>": "<date/> — translated last edit",
    },
    true,
    true,
  );
  jest.mocked(useLoadedData).mockReturnValue({
    space: { __typename: "space", id: "space-1", name: "User-authored space" },
    myDrafts: [
      {
        __typename: "discussion",
        id: "draft-1",
        state: "draft",
        title: "User-authored discussion",
        body: "{}",
        insertedAt: "2026-06-01T12:00:00Z",
        updatedAt: "2026-06-01T12:00:00Z",
      },
    ],
  });
  act(() => root.render(<page.Page />));
  expect(container.querySelector('button[aria-label="Translated draft actions"]')).not.toBeNull();
  expect(container.querySelector('a[href="/edit"]')?.textContent).toContain("User-authored discussion");
  expect(container.textContent).toContain("formatted date — translated last edit");
  expect(container.textContent).toContain("User-authored body");
});
