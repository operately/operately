import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";

import { ToolsSection } from "./ToolsSection";

// Render the surrounding tools as no-ops; this suite only exercises
// optional Space tool card visibility.
jest.mock("./GoalsAndProjects", () => ({ GoalsAndProjects: () => null }));
jest.mock("./Discussions", () => ({ Discussions: () => null }));
jest.mock("./ResourceHub", () => ({ ResourceHub: () => null }));
jest.mock("./Tasks", () => ({ Tasks: () => null }));
jest.mock("./Templates", () => ({ Templates: () => <div data-test-id="templates-tool" /> }));

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
  usePaths: () => ({
    spaceKpisPath: (id: string) => `/spaces/${id}/kpis`,
    spaceKpiPath: (spaceId: string, kpiId: string) => `/spaces/${spaceId}/kpis/${kpiId}`,
  }),
}));

function renderSection(kpisEnabled: boolean, templatesEnabled = true): string {
  return renderToStaticMarkup(
    <MemoryRouter>
      <ToolsSection
        space={{ id: "space-1", name: "Growth" } as any}
        tools={{ kpisEnabled, templatesEnabled, templates: [] } as any}
      />
    </MemoryRouter>,
  );
}

describe("ToolsSection KPIs gating", () => {
  test("hides the KPIs tool when the space has KPIs disabled", () => {
    const html = renderSection(false);
    expect(html).not.toContain('data-test-id="kpis-tool"');
  });

  test("shows the KPIs tool linking to the KPIs page when KPIs are enabled", () => {
    const html = renderSection(true);
    expect(html).toContain('data-test-id="kpis-tool"');
    expect(html).toContain('href="/spaces/space-1/kpis"');
  });
});

describe("ToolsSection Templates gating", () => {
  test("hides the Templates tool when the space has it disabled", () => {
    const html = renderSection(false, false);
    expect(html).not.toContain('data-test-id="templates-tool"');
  });

  test("shows the Templates tool when the space tool is enabled", () => {
    const html = renderSection(false, true);
    expect(html).toContain('data-test-id="templates-tool"');
  });
});
