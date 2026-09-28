/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { DocumentVersionHistoryPage, showErrorToast, showSuccessToast } from "turboui";
import { i18n, applyLanguage, setupTestCatalog } from "@/__tests__/i18n";
import { resolveEffectiveLanguage } from "@/i18n/languages";
import { Page } from "./page";

const restoreVersion = jest.fn();
jest.mock("@/models/resourceHubs", () => ({ useRestoreDocumentVersion: () => ({ mutateAsync: restoreVersion }) }));
jest.mock("./loader", () => ({
  useLoadedData: () => ({
    document: {
      id: "document-1",
      name: "User-authored document",
      permissions: { canEditDocument: true },
      currentVersion: 3,
    },
    resourceHub: {},
    versions: [],
  }),
  useRefresh: () => jest.fn(),
}));
jest.mock("./navigation", () => ({ buildDocumentVersionsPageNavigation: () => [] }));
jest.mock("@/hooks/useFormattedTimePreferences", () => ({ useFormattedTimePreferences: () => ({}) }));
jest.mock("@/hooks/useRichEditorHandlers", () => ({
  useRichEditorHandlers: () => ({ mentionedPersonLookup: jest.fn() }),
}));
jest.mock("@/routes/paths", () => ({ usePaths: () => ({ resourceHubDocumentVersionPath: () => "/comparison" }) }));
jest.mock("turboui", () => ({
  DocumentVersionHistoryPage: jest.fn(() => null),
  showErrorToast: jest.fn(),
  showSuccessToast: jest.fn(),
}));

setupTestCatalog();
let root: Root;
beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  root = createRoot(document.createElement("div"));
});
afterEach(() => {
  act(() => root.unmount());
  jest.resetAllMocks();
});

it.each(["flag-off", "missing-portuguese", "substituted"])(
  "looks up document history and restore feedback: %s",
  async (mode) => {
    if (mode === "missing-portuguese") i18n.removeResourceBundle("pt-BR", "translation");
    if (mode === "substituted")
      i18n.addResourceBundle(
        "en",
        "translation",
        {
          "History of changes": "Translated document history",
          "Version restored": "Translated restore success",
          "Version {{version}} restored as the current document.": "Translated version {{version}} restored",
          "Restore failed": "Translated restore failure",
          "We couldn't restore that version. Please try again.": "Translated restore recovery",
        },
        true,
        true,
      );
    await applyLanguage(resolveEffectiveLanguage("pt-BR", mode === "missing-portuguese"));
    act(() => root.render(<Page />));
    const props = jest.mocked(DocumentVersionHistoryPage).mock.calls.at(-1)?.[0];
    if (!props?.onRestore) throw new Error("History page did not expose restore");
    expect(props.title).toEqual([
      mode === "substituted" ? "Translated document history" : "History of changes",
      "User-authored document",
    ]);
    restoreVersion.mockResolvedValueOnce({});
    expect(await props.onRestore(2, 3)).toBe("ok");
    expect(restoreVersion).toHaveBeenCalledWith({
      documentId: "document-1",
      versionNumber: 2,
      expectedCurrentVersion: 3,
    });
    expect(showSuccessToast).toHaveBeenCalledWith(
      mode === "substituted" ? "Translated restore success" : "Version restored",
      mode === "substituted" ? "Translated version 2 restored" : "Version 2 restored as the current document.",
    );
    restoreVersion.mockRejectedValueOnce(new Error("offline"));
    expect(await props.onRestore(2, 3)).toBe("error");
    expect(showErrorToast).toHaveBeenCalledWith(
      mode === "substituted" ? "Translated restore failure" : "Restore failed",
      mode === "substituted" ? "Translated restore recovery" : "We couldn't restore that version. Please try again.",
    );
  },
);
