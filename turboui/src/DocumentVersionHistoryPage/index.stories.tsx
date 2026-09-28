import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";
import { I18nextProvider } from "react-i18next";
import { expect, userEvent, within } from "storybook/test";
import { createInstance } from "i18next";
import { i18nOptions } from "../i18nOptions";

import { createMockRichEditorHandlers } from "../utils/storybook/richEditor";
import { defaultFormattedTimePreferences } from "../utils/storybook/formattedTime";

import { DocumentVersionHistoryPage } from "./index";
import * as M from "./mockData";
import type { DocumentVersionHistoryPageProps } from "./types";

const handlers = createMockRichEditorHandlers();

const meta: Meta<typeof DocumentVersionHistoryPage> = {
  title: "Pages/DocumentVersionHistoryPage",
  component: DocumentVersionHistoryPage,
  parameters: {
    layout: "fullscreen",
    reactRouter: {
      path: "/documents/1/versions",
      routePath: "/documents/:id/versions",
    },
  },
  decorators: [
    (Story) => (
      <div className="sm:mt-8">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DocumentVersionHistoryPage>;

function baseProps(overrides: Partial<DocumentVersionHistoryPageProps> = {}): DocumentVersionHistoryPageProps {
  return {
    title: ["History of changes", M.titles.current],
    navigation: M.navigation,
    versions: M.multiVersionList,
    formattedTimePreferences: defaultFormattedTimePreferences,
    mentionedPersonLookup: handlers.mentionedPersonLookup,
    getComparisonPath: (versionNumber) => `/documents/1/versions/${versionNumber}`,
    ...overrides,
  };
}

export const Default: Story = {
  args: baseProps(),
};

export const WithRestore: Story = {
  args: baseProps({
    canRestore: true,
    currentVersionNumber: 5,
    onRestore: async () => "ok",
    onReload: () => undefined,
  }),
};

function RestoreConflictHarness() {
  const [key, setKey] = React.useState(0);

  return (
    <DocumentVersionHistoryPage
      key={key}
      {...baseProps({
        canRestore: true,
        currentVersionNumber: 5,
        onRestore: async () => "conflict",
        onReload: () => setKey((value) => value + 1),
      })}
    />
  );
}

export const RestoreConflict: Story = {
  render: () => <RestoreConflictHarness />,
  play: async ({ canvasElement }) => {
    const select = canvasElement.querySelector('[data-test-id="select-version-4"]') as HTMLButtonElement | null;
    select?.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    const restore = canvasElement.querySelector('[data-test-id="restore-this-version"]') as HTMLButtonElement | null;
    restore?.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    const confirm = Array.from(document.querySelectorAll("button")).find((button) => button.textContent === "Restore");
    confirm?.click();
  },
};

export const OneVersion: Story = {
  args: baseProps({
    title: ["History of changes", M.titles.oneVersion],
    navigation: M.navigationFor(M.titles.oneVersion),
    versions: M.oneVersionList,
  }),
};

export const MobileStacked: Story = {
  args: baseProps(),
  parameters: {
    viewport: { defaultViewport: "mobile1" },
  },
};

const expandedCatalog = createInstance();
void expandedCatalog.init({ ...i18nOptions, initImmediate: false });
expandedCatalog.addResourceBundle(
  "en",
  "translation",
  {
    "History of changes": "Expanded translated history of all changes made to this document",
    "Restore This Version": "Restore this earlier version of the document",
    "Restore this version?": "Restore this earlier version as the current document?",
    "This replaces the current title and content with the selected version. Later versions will stay in the history.":
      "Expanded translated confirmation: the selected version replaces the current document title and content, and all later versions remain available in the history.",
    Restore: "Confirm restoring this document version",
  },
  true,
  true,
);

export const ExpandedCatalog: Story = {
  args: baseProps({ canRestore: true, currentVersionNumber: 5, onRestore: async () => "ok" }),
  decorators: [
    (Story) => (
      <I18nextProvider i18n={expandedCatalog}>
        <Story />
      </I18nextProvider>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const heading = canvas.getByRole("heading", { level: 1 });
    await expect(heading).toHaveTextContent("Expanded translated history of all changes made to this document");
    await expect(heading.scrollWidth).toBeLessThanOrEqual(heading.clientWidth);
    const version = canvasElement.querySelector('[data-test-id="select-version-4"]') as HTMLButtonElement | null;
    if (!version) throw new Error("Version selection is missing");
    await userEvent.click(version);
    await userEvent.click(canvas.getByRole("button", { name: "Restore this earlier version of the document" }));
    await canvas.findByRole("heading", { name: "Restore this earlier version as the current document?" });
    const dialog = canvasElement.querySelector('[data-test-id="restore-version-confirm"]') as HTMLElement | null;
    if (!dialog) throw new Error("Restore confirmation is missing");
    const confirm = within(dialog).getByRole("button", { name: "Confirm restoring this document version" });
    await expect(confirm).toBeVisible();
    await expect(dialog.scrollWidth).toBeLessThanOrEqual(dialog.clientWidth);
    await expect(confirm.scrollWidth).toBeLessThanOrEqual(confirm.clientWidth);
    await userEvent.click(confirm);
  },
};
