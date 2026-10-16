/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import { MemoryRouter, useLocation, useNavigate } from "react-router";
import { CuratedTemplateDetailPage } from "turboui";
import type { CuratedTemplate, TemplateInput } from "turboui";
import { act, renderHook } from "@/__tests__/renderHook";
import { templateFixture } from "../../../../../../turboui/src/CuratedTemplates/mockData";
import { Page } from "./index";

let mockTemplate: CuratedTemplate | undefined;
const mockSave = jest.fn();
const mockSavePreviewData = jest.fn();

jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock("turboui", () => ({ CuratedTemplateDetailPage: jest.fn(() => null) }));
jest.mock("./loader", () => ({ useLoadedData: () => ({ template: mockTemplate }) }));
jest.mock("@/hooks/useFormattedTimePreferences", () => ({ useFormattedTimePreferences: () => ({}) }));
jest.mock("@/components/Pages", () => ({ Page: ({ children }: React.PropsWithChildren) => children }));
jest.mock("@/ee/models/curatedTemplateLifecycle", () => ({
  curatedTemplatesPath: "/admin/curated-templates",
  curatedTemplatePath: (id: string) => `/admin/curated-templates/${id}`,
  curatedTemplateEditPath: (id: string) => `/admin/curated-templates/${id}/edit`,
  curatedTemplatePreviewPath: (id: string) => `/admin/curated-templates/${id}/preview`,
  useSaveCuratedTemplate: () => ({ save: mockSave, savePreviewData: mockSavePreviewData, getIdentity: jest.fn() }),
  useDeleteCuratedTemplate: () => ({ mutateAsync: jest.fn() }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockTemplate = templateFixture("kpi");
});

function mount(path = "/admin/curated-templates/template-kpi") {
  const wrapper = ({ children }: React.PropsWithChildren) => (
    <MemoryRouter initialEntries={[path]}>
      <Page />
      {children}
    </MemoryRouter>
  );
  return renderHook(() => ({ location: useLocation(), navigate: useNavigate() }), { initialProps: undefined, wrapper });
}

function detailProps() {
  const calls = jest.mocked(CuratedTemplateDetailPage).mock.calls;
  const lastCall = calls[calls.length - 1];
  if (!lastCall) throw new Error("Template page has not rendered");
  return lastCall[0];
}

const input: TemplateInput = {
  title: "Updated KPI",
  slug: "updated-kpi",
  type: "kpi",
  summary: "",
  category: "",
  contentLanguage: "en",
  definition: JSON.stringify({ name: "Updated KPI", unit: "%", cadence: "monthly" }),
};

it("opens saved templates in read mode and enters edit mode through its URL", () => {
  const { result } = mount();
  expect(detailProps().editing).toBe(false);
  act(() => result.current.navigate(detailProps().editPath ?? ""));
  expect(result.current.location.pathname).toBe("/admin/curated-templates/template-kpi/edit");
  expect(detailProps().editing).toBe(true);
  act(() => detailProps().onCancel());
  expect(detailProps().editing).toBe(false);
});

it.each([
  ["create", "draft"],
  ["create", "publish"],
  ["edit", "draft"],
  ["edit", "publish"],
] as const)("returns to the read view after %s with %s", async (mode, intent) => {
  if (mode === "create") mockTemplate = undefined;
  const { result } = mount(
    mode === "create" ? "/admin/curated-templates/new" : "/admin/curated-templates/template-kpi/edit",
  );
  expect(detailProps().editing).toBe(true);
  mockSave.mockImplementation(async () => {
    mockTemplate = { ...templateFixture("kpi"), ...input, state: intent === "publish" ? "published" : "draft" };
    return { template: mockTemplate, errors: [] };
  });
  await act(async () => {
    await detailProps().onSave(input, intent);
  });
  expect(result.current.location.pathname).toBe("/admin/curated-templates/template-kpi");
  expect(detailProps().editing).toBe(false);
  expect(detailProps().template?.title).toBe(input.title);
});

it("keeps validation failures in edit mode, including partially saved drafts", async () => {
  const { result } = mount("/admin/curated-templates/template-kpi/edit");
  mockSave.mockResolvedValue({ template: mockTemplate, errors: [{ path: "definition.unit", message: "Required" }] });
  await act(async () => {
    await detailProps().onSave(input, "publish");
  });
  expect(result.current.location.pathname).toBe("/admin/curated-templates/template-kpi/edit");
  expect(detailProps().editing).toBe(true);
});

it("returns to the read view after saving example data", async () => {
  const { result } = mount("/admin/curated-templates/template-kpi/edit");
  mockSavePreviewData.mockResolvedValue({ template: mockTemplate, errors: [] });
  await act(async () => {
    await detailProps().onSavePreviewData?.("{}");
  });
  expect(result.current.location.pathname).toBe("/admin/curated-templates/template-kpi");
  expect(detailProps().editing).toBe(false);
});

it("returns to the catalog when canceling creation", () => {
  mockTemplate = undefined;
  const { result } = mount("/admin/curated-templates/new");
  act(() => detailProps().onCancel());
  expect(result.current.location.pathname).toBe("/admin/curated-templates");
});
