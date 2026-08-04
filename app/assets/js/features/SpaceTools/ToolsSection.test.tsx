import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";

import { ToolsSection } from "./ToolsSection";

// Render the surrounding tools as no-ops; this suite only exercises the
// experimental-feature gating of the KPIs tool card.
jest.mock("./GoalsAndProjects", () => ({ GoalsAndProjects: () => null }));
jest.mock("./Discussions", () => ({ Discussions: () => null }));
jest.mock("./ResourceHub", () => ({ ResourceHub: () => null }));
jest.mock("./Tasks", () => ({ Tasks: () => null }));

// The shared Container renders turboui's DivLink, which pulls a duplicate
// React/react-router under jest. Swap it for a plain anchor so the gating test
// stays focused and free of cross-package context issues.
jest.mock("./components", () => ({
  Container: ({ path, testId, children }: any) => (
    <a href={path} data-test-id={testId}>
      {children}
    </a>
  ),
}));

// turboui bundles its own React instance, so stub the KPI summary content.
jest.mock("turboui", () => ({ KpiSummaryCard: () => null }));

jest.mock("@/routes/paths", () => ({
  usePaths: () => ({ spaceKpisPath: (id: string) => `/spaces/${id}/kpis` }),
}));

const mockCompany = jest.fn();
jest.mock("@/routes/useCompanyLoaderData", () => ({
  useCompanyLoaderData: () => ({ company: mockCompany() }),
}));

function renderSection(enabledExperimentalFeatures: string[], kpisEnabled: boolean): string {
  mockCompany.mockReturnValue({ enabledExperimentalFeatures });

  return renderToStaticMarkup(
    <MemoryRouter>
      <ToolsSection space={{ id: "space-1", name: "Growth" } as any} tools={{ kpisEnabled } as any} />
    </MemoryRouter>,
  );
}

describe("ToolsSection KPIs gating", () => {
  test("hides the KPIs tool when the space_kpis feature is off", () => {
    const html = renderSection([], true);
    expect(html).not.toContain('data-test-id="kpis-tool"');
  });

  test("hides the KPIs tool when the feature is on but the space has KPIs disabled", () => {
    const html = renderSection(["space_kpis"], false);
    expect(html).not.toContain('data-test-id="kpis-tool"');
  });

  test("shows the KPIs tool linking to the KPIs page when the feature is on and KPIs are enabled", () => {
    const html = renderSection(["space_kpis"], true);
    expect(html).toContain('data-test-id="kpis-tool"');
    expect(html).toContain('href="/spaces/space-1/kpis"');
  });
});
