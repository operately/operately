/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import Api from "@/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@/__tests__/renderHook";
import { useMilestones } from "./useMilestones";

jest.mock("axios");
jest.mock("turboui", () => ({ parseContent: JSON.parse, richContentToString: () => "" }));
jest.mock("react-router", () => ({}));
jest.mock("@/api/staleClient", () => ({ handleStaleClientError: jest.fn() }));
jest.mock("@/routes/paths", () => {
  const actual = jest.requireActual("@/routes/paths");
  const paths = new actual.Paths({ companyId: "company1" });

  return { ...actual, usePaths: () => paths };
});

let client: QueryClient;

beforeEach(() => {
  jest.clearAllMocks();
  client = new QueryClient();
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company1" });
});

afterEach(() => client.clear());

function mount<Props, Result>(hook: (props: Props) => Result, initialProps: Props) {
  return renderHook(hook, {
    initialProps,
    wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
  });
}

it("loads and filters milestones in server order and resets for another project", async () => {
  jest.mocked(axios.get).mockResolvedValue({
    data: {
      milestones: [
        { id: "m2", title: "Second", status: "pending" },
        { id: "m1", title: "First", status: "pending" },
      ],
    },
  });
  const hook = mount(useMilestones, "project1");

  await waitFor(() => expect(hook.result.current.milestones.map((m) => m.id)).toEqual(["m2", "m1"]));

  await act(async () => {
    await hook.result.current.search(" Second ");
  });

  await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));
  expect(jest.mocked(axios.get).mock.calls.at(-1)?.[1]?.params).toEqual({ project_id: "project1", query: "Second" });

  hook.rerender("project2");

  expect(hook.result.current.milestones).toEqual([]);
  await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(3));
  expect(jest.mocked(axios.get).mock.calls.at(-1)?.[1]?.params).toEqual({ project_id: "project2", query: "" });
});
