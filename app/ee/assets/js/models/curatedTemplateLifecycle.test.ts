/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import { act, renderHook } from "@/__tests__/renderHook";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AdminApi from "@/ee/admin_api";
import { templateFixture } from "../../../../../turboui/src/CuratedTemplates/mockData";
import { invalidateCuratedTemplates, useSaveCuratedTemplate } from "./curatedTemplateLifecycle";

it("invalidates template lists and details while preserving unrelated queries", async () => {
  AdminApi.default.setBasePath("/admin/api/v1");
  const client = new QueryClient();
  const list = AdminApi.curated_templates.listQueryKey({});
  const detail = AdminApi.curated_templates.getQueryKey({ id: "template" });
  const unrelated = AdminApi.listSiteMessagesQueryKey({});
  [list, detail, unrelated].forEach((key) => client.setQueryData(key, {}));
  await invalidateCuratedTemplates(client);
  expect(client.getQueryState(list)?.isInvalidated).toBe(true);
  expect(client.getQueryState(detail)?.isInvalidated).toBe(true);
  expect(client.getQueryState(unrelated)?.isInvalidated).toBe(false);
  client.clear();
});

const input = {
  title: "Template",
  type: "kpi" as const,
  summary: "",
  category: "",
  contentLanguage: "en",
  definition: "{}",
};

function setupSave() {
  const draft = templateFixture("kpi");
  const create = jest.fn().mockResolvedValue({ template: draft, errors: [] });
  const update = jest.fn().mockResolvedValue({ template: { ...draft, updatedAt: "2026-10-10T12:00:00Z" }, errors: [] });
  const publish = jest.fn().mockResolvedValue({ template: { ...draft, state: "published" }, errors: [] });
  jest.spyOn(AdminApi.curated_templates, "createMutationOptions").mockReturnValue({ mutationFn: create });
  jest.spyOn(AdminApi.curated_templates, "updateMutationOptions").mockReturnValue({ mutationFn: update });
  jest.spyOn(AdminApi.curated_templates, "publishMutationOptions").mockReturnValue({ mutationFn: publish });
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children);
  const hook = renderHook(() => useSaveCuratedTemplate(), { initialProps: undefined, wrapper });
  return { ...hook, create, update, publish, draft };
}

afterEach(() => jest.restoreAllMocks());

it("publishes a newly saved draft using its returned timestamp", async () => {
  const { result, create, publish, draft } = setupSave();
  await act(async () => {
    await result.current.save(input, "publish");
  });
  expect(create).toHaveBeenCalledWith(input, expect.anything());
  expect(publish).toHaveBeenCalledWith({ id: draft.id, expectedUpdatedAt: draft.updatedAt }, expect.anything());
});

it("saves drafts without publishing", async () => {
  const { result, publish } = setupSave();
  await act(async () => {
    await result.current.save(input, "draft");
  });
  expect(publish).not.toHaveBeenCalled();
});

it("retries failed publication by updating the saved draft", async () => {
  const { result, create, update, publish, draft } = setupSave();
  const errors = [{ path: "definition.unit", message: "Required" }];
  publish.mockResolvedValueOnce({ errors });
  await act(async () => {
    expect(await result.current.save(input, "publish")).toEqual({ errors });
  });
  expect(result.current.getIdentity()).toEqual({ id: draft.id, expectedUpdatedAt: draft.updatedAt });
  await act(async () => {
    await result.current.save(input, "publish");
  });
  expect(create).toHaveBeenCalledTimes(1);
  expect(update).toHaveBeenCalledTimes(1);
  expect(publish).toHaveBeenLastCalledWith(
    { id: draft.id, expectedUpdatedAt: "2026-10-10T12:00:00Z" },
    expect.anything(),
  );
});
