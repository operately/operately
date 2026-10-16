/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import { MemoryRouter, useLocation, useNavigate } from "react-router";
import { CuratedTemplatesCatalogPage } from "turboui";
import { act, renderHook } from "@/__tests__/renderHook";
import { Page } from "./index";

jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock("turboui", () => ({ CuratedTemplatesCatalogPage: jest.fn(() => null) }));
jest.mock("./loader", () => ({ useLoadedData: () => ({ templates: [] }) }));
jest.mock("@/hooks/useFormattedTimePreferences", () => ({ useFormattedTimePreferences: () => ({}) }));
jest.mock("@/components/Pages", () => ({ Page: ({ children }: React.PropsWithChildren) => children }));
jest.mock("@/ee/models/curatedTemplateLifecycle", () => ({
  curatedTemplatesPath: "/admin/curated-templates",
  curatedTemplatePath: (id: string) => `/admin/curated-templates/${id}`,
  curatedTemplatePreviewPath: (id: string) => `/admin/curated-templates/${id}/preview`,
}));

beforeEach(() => jest.clearAllMocks());

function mount(search = "") {
  const wrapper = ({ children }: React.PropsWithChildren) => (
    <MemoryRouter initialEntries={[`/admin/curated-templates${search}`]}>
      <Page />
      {children}
    </MemoryRouter>
  );
  return renderHook(() => ({ location: useLocation(), navigate: useNavigate() }), {
    initialProps: undefined,
    wrapper,
  });
}

function catalogProps() {
  const calls = jest.mocked(CuratedTemplatesCatalogPage).mock.calls;
  const lastCall = calls[calls.length - 1];
  if (!lastCall) throw new Error("Catalog has not rendered");
  return lastCall[0];
}

it.each(["project", "goal", "kpi"])("opens the %s tab from its URL", (tab) => {
  mount(`?tab=${tab}`);
  expect(catalogProps().selectedType).toBe(tab);
});

it.each(["", "?tab=", "?tab=unknown"])("defaults to Projects for %s", (search) => {
  mount(search);
  expect(catalogProps().selectedType).toBe("project");
});

it("updates the URL on tab changes and follows browser history", () => {
  const { result } = mount("?filter=draft");
  act(() => catalogProps().onSelectedTypeChange?.("goal"));
  expect(result.current.location.search).toBe("?filter=draft&tab=goal");
  expect(catalogProps().selectedType).toBe("goal");
  act(() => catalogProps().onSelectedTypeChange?.("kpi"));
  expect(result.current.location.search).toBe("?filter=draft&tab=kpi");
  expect(catalogProps().selectedType).toBe("kpi");
  act(() => result.current.navigate(-1));
  expect(catalogProps().selectedType).toBe("goal");
  act(() => result.current.navigate(-1));
  expect(catalogProps().selectedType).toBe("project");
  act(() => result.current.navigate(1));
  expect(catalogProps().selectedType).toBe("goal");
});
