/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { waitFor } from "@/__tests__/renderHook";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import {
  useAddSpaceMembers,
  useJoinSpace,
  useEditSpaceMembersPermissions,
  useRemoveGroupMember,
  useEditSpacePermissions,
} from "./spaceAccessLifecycle";
import Api from "@/api";
import { QueryClient } from "@tanstack/react-query";
import { invalidateSpaceAccessQueries } from "./spaceAccessLifecycle";

jest.mock("turboui", () => ({}));

beforeAll(() => {
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company1" });
});

it("invalidates access data for every space ID variant without touching unrelated resources", async () => {
  const client = new QueryClient();
  const affected = [
    Api.spaces.countByAccessLevelQueryKey({ accessLevel: "edit_access" }),
    Api.spaces.getQueryKey({ id: "space1" }),
    Api.spaces.getQueryKey({ id: "renamed-space1", includePermissions: true }),
    Api.spaces.listToolsQueryKey({ spaceId: "space1" }),
    Api.spaces.listToolsQueryKey({ spaceId: "old-space1" }),
    Api.people.getBindedQueryKey({ resourseType: "space", resourseId: "space1" }),
    Api.people.getBindedQueryKey({ resourseType: "space", resourseId: "old-space1" }),
    Api.spaces.listQueryKey({}),
    Api.spaces.listQueryKey({ includeMembers: true }),
    Api.spaces.searchQueryKey({ query: "marketing" }),
    Api.companies.getWorkMapQueryKey({}),
    Api.companies.getWorkMapQueryKey({ spaceId: "space1" }),
    Api.companies.listActivitiesQueryKey({ scopeType: "space", scopeId: "space1", actions: [] }),
  ];

  const unrelated = [
    Api.spaces.getQueryKey({ id: "space2" }),
    Api.spaces.listToolsQueryKey({ spaceId: "space2" }),
    Api.people.getBindedQueryKey({ resourseType: "space", resourseId: "space2" }),
    Api.people.getBindedQueryKey({ resourseType: "project", resourseId: "space1" }),
    Api.projects.getQueryKey({ id: "space1" }),
    Api.projects.listQueryKey({}),
  ];

  [...affected, ...unrelated].forEach((key) => client.setQueryData(key, {}));

  await invalidateSpaceAccessQueries(client, "space1");

  affected.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(true));
  unrelated.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(false));

  client.clear();
});

jest.mock("axios");
jest.mock("react-router", () => ({}));

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  jest.clearAllMocks();
});

const mutations = [
  ["join", useJoinSpace, { spaceId: "space1" }],
  ["add members", useAddSpaceMembers, { spaceId: "space1", members: [{ id: "person1", accessLevel: 40 }] }],
  [
    "update member",
    useEditSpaceMembersPermissions,
    { spaceId: "space1", members: [{ id: "person1", accessLevel: 70 }] },
  ],
  ["remove member", useRemoveGroupMember, { spaceId: "space1", memberId: "person1" }],
  ["edit general access", useEditSpacePermissions, { spaceId: "space1", accessLevels: { public: 0, company: 10 } }],
] as const;

it.each(mutations)("%s invalidates only after a successful mutation", async (_name, useHook, input) => {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const space = Api.spaces.getQueryKey({ id: "space1" });
  const other = Api.spaces.getQueryKey({ id: "space2" });
  [space, other].forEach((key) => client.setQueryData(key, {}));

  let mutate: (input: any) => Promise<unknown>;

  function Harness() {
    mutate = useHook().mutateAsync as typeof mutate;
    return null;
  }

  const root = createRoot(document.createElement("div"));

  try {
    await act(async () =>
      root.render(React.createElement(QueryClientProvider, { client }, React.createElement(Harness))),
    );

    jest.mocked(axios.post).mockRejectedValueOnce(new Error("Save failed"));

    await act(async () => {
      await expect(mutate(input)).rejects.toThrow("Save failed");
    });

    expect(client.getQueryState(space)?.isInvalidated).toBe(false);

    jest.mocked(axios.post).mockResolvedValueOnce({ data: { success: true } });

    await act(async () => {
      await mutate(input);
    });

    expect(client.getQueryState(space)?.isInvalidated).toBe(true);
    expect(client.getQueryState(other)?.isInvalidated).toBe(false);
  } finally {
    await act(async () => root.unmount());
    client.clear();
  }
});

it.each(mutations)("%s waits for invalidation before resolving", async (_name, useHook, input) => {
  const client = new QueryClient();
  let finish = () => {};
  const pending = new Promise<void>((resolve) => {
    finish = resolve;
  });
  const invalidate = jest.spyOn(client, "invalidateQueries").mockReturnValue(pending);

  let mutate: (input: any) => Promise<unknown>;

  function Harness() {
    mutate = useHook().mutateAsync as typeof mutate;
    return null;
  }

  const root = createRoot(document.createElement("div"));

  try {
    await act(async () =>
      root.render(React.createElement(QueryClientProvider, { client }, React.createElement(Harness))),
    );

    jest.mocked(axios.post).mockResolvedValueOnce({ data: {} });
    let completed = false;
    let saving: Promise<unknown>;
    act(() => {
      saving = mutate(input).then(() => {
        completed = true;
      });
    });

    await waitFor(() => expect(invalidate).toHaveBeenCalled());
    expect(completed).toBe(false);

    await act(async () => {
      finish();
      await saving;
    });

    expect(completed).toBe(true);
  } finally {
    finish();
    await act(async () => root.unmount());
    client.clear();
  }
});
