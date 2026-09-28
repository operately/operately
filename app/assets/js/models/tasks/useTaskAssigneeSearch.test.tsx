/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import Api from "@/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@/__tests__/renderHook";
import { showErrorToast } from "turboui";
import { useTaskAssigneeSearch } from "./useTaskAssigneeSearch";

jest.mock("axios");
jest.mock("turboui", () => ({ showErrorToast: jest.fn() }));
jest.mock("@/api/staleClient", () => ({ handleStaleClientError: jest.fn() }));

let client: QueryClient;

beforeEach(() => {
  jest.clearAllMocks();
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company1" });
  jest.mocked(axios.get).mockResolvedValue({ data: { people: [{ id: "ada", full_name: "Ada" }] } });
});

afterEach(() => client.clear());

function mount() {
  return renderHook(() => useTaskAssigneeSearch({ id: "project1", type: "project", ignoredIds: ["ignored", null] }), {
    initialProps: undefined,
    wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
  });
}

it("loads initial options and caches searches with their context and exclusions", async () => {
  const hook = mount();

  await waitFor(() => expect(hook.result.current.people).toHaveLength(1));

  await act(async () => {
    await hook.result.current.onSearch(" Ada ");
  });

  await waitFor(() =>
    expect(
      client.getQueryData(
        Api.tasks.listPotentialAssigneesQueryKey({
          id: "project1",
          type: "project",
          ignoredIds: ["ignored"],
          query: "Ada",
        }),
      ),
    ).toEqual({ people: [{ id: "ada", fullName: "Ada" }] }),
  );
  expect(jest.mocked(axios.get).mock.calls.at(-1)?.[1]?.params).toEqual({
    id: "project1",
    type: "project",
    ignored_ids: ["ignored"],
    query: "Ada",
  });

  await act(async () => {
    await hook.result.current.onSearch(" Ada ");
  });

  expect(axios.get).toHaveBeenCalledTimes(2);
});

it.each([401, 500])("reports an initial %s failure and recovers when searching again", async (status) => {
  jest.mocked(axios.get).mockRejectedValue({ isAxiosError: true, response: { status } });
  const hook = mount();

  await waitFor(() => expect(showErrorToast).toHaveBeenCalledTimes(1));
  expect(hook.result.current.people).toEqual([]);

  jest.mocked(axios.get).mockResolvedValue({ data: { people: [{ id: "ada", full_name: "Ada" }] } });

  await act(async () => {
    await hook.result.current.onSearch("");
  });

  await waitFor(() => expect(hook.result.current.people).toHaveLength(1));
});
