/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Api from "@/api";
import { useDocumentUpdates } from "./useDocumentUpdates";

let mockSignal: () => void;
let mockJoined: () => void;
let mockPayload: { documentId: string };
jest.mock("@/signals", () => ({
  useDocumentUpdatedSignal: (callback: () => void, payload: { documentId: string }, joined: () => void) => {
    mockSignal = callback;
    mockJoined = joined;
    mockPayload = payload;
  },
}));
jest.mock("turboui", () => ({}));
jest.mock("react-router", () => ({}));

it("refreshes the document and anchors on updates and reconnects without invalidating unrelated resources", async () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company-1" });
  const client = new QueryClient();
  const root = createRoot(document.createElement("div"));
  const affected = [
    Api.documents.getQueryKey({ id: "doc1" }),
    Api.documents.getQueryKey({ id: "old-title-doc1", includeAuthor: true }),
    Api.documents.listVersionsQueryKey({ documentId: "doc1" }),
    Api.inline_threads.listQueryKey({ resourceType: "resource_hub_document", resourceId: "doc1" }),
  ];
  const unrelated = [
    Api.documents.getQueryKey({ id: "doc2" }),
    Api.comments.listQueryKey({ entityType: "resource_hub_document", entityId: "doc1" }),
    Api.projects.getQueryKey({ id: "project1" }),
  ];
  function Subscriber({ id }: { id: string }) {
    useDocumentUpdates(id);
    return null;
  }
  const render = (id: string) =>
    root.render(
      <QueryClientProvider client={client}>
        <Subscriber id={id} />
      </QueryClientProvider>,
    );
  try {
    await act(async () => render("doc1"));
    const payload = mockPayload;
    for (const notify of [mockJoined, mockSignal, mockJoined]) {
      [...affected, ...unrelated].forEach((key) => client.setQueryData(key, {}));
      await act(async () => notify());
      affected.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(true));
      unrelated.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(false));
    }
    await act(async () => render("doc1"));
    expect(mockPayload).toBe(payload);
    await act(async () => render("doc2"));
    expect(mockPayload).toEqual({ documentId: "doc2" });
  } finally {
    await act(async () => root.unmount());
    client.clear();
  }
});
