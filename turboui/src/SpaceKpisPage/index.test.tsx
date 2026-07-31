import * as React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";

import { SpaceKpisPage } from "./index";
import type { SpaceKpisPage as SpaceKpisPageNS } from "./types";
import { mockChampionSearch, mockCurrentUser, mockKpis, mockSpace } from "./mockData";

// These tests guard the unified space-tool layout: the KPIs page should present
// the same page chrome (breadcrumb navigation + tool title + header action) as
// the other space tools rather than an in-page tab bar.
function renderPage(overrides: Partial<SpaceKpisPageNS.Props> = {}) {
  const props: SpaceKpisPageNS.Props = {
    space: mockSpace,
    navigation: [{ to: `/spaces/${mockSpace.id}`, label: mockSpace.name }],
    kpis: mockKpis,
    currentUser: mockCurrentUser,
    championSearch: mockChampionSearch,
    onCreateKpi: async () => ({ success: true }),
    onRecordEntry: async () => ({ success: true }),
    ...overrides,
  };

  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <SpaceKpisPage {...props} />
    </MemoryRouter>,
  );
}

describe("SpaceKpisPage layout", () => {
  test("renders the shared space-tool header: breadcrumb back to the space and the tool title", () => {
    renderPage();

    // Breadcrumb crumb linking back to the space.
    const spaceCrumb = screen.getByRole("link", { name: mockSpace.name });
    expect(spaceCrumb).toHaveAttribute("href", `/spaces/${mockSpace.id}`);

    // Tool title in the header.
    expect(screen.getByRole("heading", { name: "KPIs" })).toBeInTheDocument();
  });

  test("does not render an in-page tab bar for the other space tools", () => {
    renderPage();

    // The old POC layout rendered Overview/Goals/Projects/Docs tabs inside the
    // page; the unified layout must not.
    expect(screen.queryByText("Overview")).not.toBeInTheDocument();
    expect(screen.queryByText("Docs & Files")).not.toBeInTheDocument();
  });

  test("shows the primary 'New KPI' action in the header while listing", () => {
    const { container } = renderPage();

    expect(container.querySelector('[data-test-id="new-kpi"]')).toBeInTheDocument();
  });

  test("opening a KPI moves its name into the header and swaps the primary action to 'Log update'", () => {
    const target = mockKpis[0]!;
    const { container } = renderPage({ initialSelectedKpiId: target.id });

    // KPI name becomes the header title...
    expect(screen.getByRole("heading", { name: target.name })).toBeInTheDocument();

    // ...and "KPIs" becomes a breadcrumb back to the list.
    const backCrumb = container.querySelector('[data-test-id="kpis-breadcrumb"]');
    expect(backCrumb).toBeInTheDocument();

    // The header action is now "Log update", not "New KPI".
    expect(container.querySelector('[data-test-id="kpi-detail-log-update"]')).toBeInTheDocument();
    expect(container.querySelector('[data-test-id="new-kpi"]')).not.toBeInTheDocument();

    // Clicking the breadcrumb returns to the list.
    fireEvent.click(backCrumb!);
    expect(screen.getByRole("heading", { name: "KPIs" })).toBeInTheDocument();
    expect(container.querySelector('[data-test-id="new-kpi"]')).toBeInTheDocument();
  });

  test("read-only viewers see no header action", () => {
    const { container } = renderPage({ canManage: false });

    expect(container.querySelector('[data-test-id="new-kpi"]')).not.toBeInTheDocument();
  });
});
