/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import { renderHook } from "@/__tests__/renderHook";
import { useDocumentPageOptions } from "./Options";
import { useLoadedData } from "./loader";

jest.mock("./loader", () => ({ useLoadedData: jest.fn() }));
jest.mock("turboui", () => ({}));
jest.mock("@/routes/paths", () => {
  const paths = {
    resourceHubEditDocumentPath: () => "/edit",
    resourceHubDocumentVersionsPath: () => "/versions",
  };
  return { usePaths: () => paths };
});
jest.mock("@/utils/markdown", () => ({ downloadMarkdown: jest.fn(), exportToMarkdown: jest.fn() }));

it("updates the sharing action label when sharing is enabled and disabled", () => {
  const document = {
    id: "document",
    state: "published",
    publicUrl: null as string | null,
    permissions: { canEditDocument: true },
  };
  (useLoadedData as jest.Mock).mockImplementation(() => ({ document }));
  const callbacks = { showCopyModal: jest.fn(), showDeleteModal: jest.fn(), showPublicSharingModal: jest.fn() };
  const { result, rerender } = renderHook(() => useDocumentPageOptions(callbacks), { initialProps: undefined });
  const sharingOption = () => result.current.find((option) => option.testId === "share-document-publicly");

  expect(sharingOption()?.label).toBe("Share publicly");
  document.publicUrl = "https://example.com/public/documents/token";
  rerender(undefined);
  expect(sharingOption()?.label).toBe("Manage public sharing");
  sharingOption()?.onClick?.();
  expect(callbacks.showPublicSharingModal).toHaveBeenCalledTimes(1);

  document.publicUrl = null;
  rerender(undefined);
  expect(sharingOption()?.label).toBe("Share publicly");
});
