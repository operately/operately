/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import Api from "@/api";
import { useProjectDocsQueries } from "./docsQueries";

jest.mock("axios");
jest.mock("turboui", () => ({}));

function deferred() {
  let resolve!: (response: { data: object }) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<{ data: object }>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

let client: QueryClient;
let root: Root;
let result: ReturnType<typeof useProjectDocsQueries>;
let requests: Array<{ path: string; response: ReturnType<typeof deferred> }>;
function Harness({ id }: { id?: string }) {
  result = useProjectDocsQueries(id);
  return null;
}
async function render(id: string | undefined = "hub-1") {
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <Harness id={id} />
      </QueryClientProvider>,
    ),
  );
}
async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}
async function resolveAll(data: object) {
  await act(async () => {
    requests.forEach(({ response }) => response.resolve({ data }));
  });
  await settle();
}

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company-1" });
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  root = createRoot(document.createElement("div"));
  requests = [];
  jest.mocked(axios.get).mockImplementation((path) => {
    const response = deferred();
    requests.push({ path, response });
    return response.promise;
  });
});
afterEach(async () => {
  await act(async () => root.unmount());
  client.clear();
  jest.clearAllMocks();
});

it("starts both docs queries on mount and shows loading until both finish", async () => {
  await render();
  expect(requests.map(({ path }) => path).sort()).toEqual([
    "/api/v2/resource_hubs/get",
    "/api/v2/resource_hubs/list_nodes",
  ]);
  expect(result.loading).toBe(true);
  await act(async () =>
    requests.find(({ path }) => path.endsWith("/get"))?.response.resolve({ data: { resourceHub: { id: "hub-1" } } }),
  );
  await settle();
  expect(result.loading).toBe(true);
  await resolveAll({ nodes: [{ id: "node-1" }], draftNodes: [] });
  expect(result.data?.nodes[0]?.id).toBe("node-1");
  expect(result.loading).toBe(false);
});

it("disables requests without a hub", async () => {
  await render("");
  expect(requests).toHaveLength(0);
  expect(result.available).toBe(false);
  expect(result.loading).toBe(false);
});

it("preserves cached docs during background refresh and allows retry after failure", async () => {
  await render();
  await resolveAll({ resourceHub: { id: "hub-1" }, nodes: [{ id: "node-1" }] });
  requests = [];
  let refresh!: Promise<void>;
  await act(async () => {
    refresh = result.refresh();
  });
  expect(result.data?.nodes[0]?.id).toBe("node-1");
  expect(result.loading).toBe(false);
  await act(async () => {
    requests.forEach(({ response }) => response.reject(new Error("Unavailable")));
    await refresh;
  });
  await settle();
  expect(result.error).toBe(true);
  expect(result.data?.nodes[0]?.id).toBe("node-1");
  requests = [];
  await act(async () => result.retry());
  await resolveAll({ resourceHub: { id: "hub-1" }, nodes: [] });
  expect(result.error).toBe(false);
  expect(result.data?.nodes).toEqual([]);
});

it("does not show old docs after switching hubs or removing access", async () => {
  await render();
  const old = requests;
  requests = [];
  await render("hub-2");
  await act(async () =>
    old.forEach(({ response }) => response.resolve({ data: { resourceHub: { id: "hub-1" }, nodes: [{ id: "old" }] } })),
  );
  await settle();
  expect(result.data).toBeNull();
  await resolveAll({ resourceHub: { id: "hub-2" }, nodes: [{ id: "new" }] });
  expect(result.data?.nodes[0]?.id).toBe("new");
  await render("");
  expect(result.data).toBeNull();
});
