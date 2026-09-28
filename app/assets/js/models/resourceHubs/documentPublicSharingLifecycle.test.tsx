/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Api from "@/api";
import { act, renderHook } from "@/__tests__/renderHook";
import { useUpdateDocumentPublicSharing } from "./documentPublicSharingLifecycle";

jest.mock("turboui", () => ({}));

beforeAll(() => {
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({});
});

it("refreshes private document data and removes cached public content after revocation", async () => {
  const client = new QueryClient();
  const documentKey = Api.documents.getQueryKey({ id: "document" });
  const publicKey = Api.documents.getPublicQueryKey({ token: "public-token" });
  const unrelatedKey = Api.projects.getQueryKey({ id: "project" });
  [documentKey, publicKey, unrelatedKey].forEach((key) => client.setQueryData(key, {}));
  const spy = jest.spyOn(Api.documents, "updatePublicSharingMutationOptions").mockReturnValue({
    mutationFn: async () => ({ publicUrl: null }),
  });
  const wrapper = ({ children }: React.PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  try {
    const { result } = renderHook(useUpdateDocumentPublicSharing, { initialProps: undefined, wrapper });
    await act(async () => {
      await result.current.mutateAsync({ documentId: "document", enabled: false });
    });
    expect(client.getQueryState(documentKey)?.isInvalidated).toBe(true);
    expect(client.getQueryData(publicKey)).toBeUndefined();
    expect(client.getQueryState(unrelatedKey)?.isInvalidated).toBe(false);
  } finally {
    spy.mockRestore();
    client.clear();
  }
});
