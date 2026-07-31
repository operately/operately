import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";

import { SpaceKpisPage } from "./index";
import type { SpaceKpisPage as SpaceKpisPageNS } from "./types";
import { mockChampionSearch, mockCurrentUser, mockKpis, mockSpace } from "./mockData";

// This codebase tags elements with `data-test-id` (not the default
// `data-testid`), so we resolve them via the attribute selector, polling until
// they appear for menu/modal content that mounts asynchronously.
async function findByTestId(testId: string): Promise<HTMLElement> {
  return waitFor(() => {
    const el = document.querySelector<HTMLElement>(`[data-test-id="${testId}"]`);
    if (!el) throw new Error(`Could not find element with data-test-id="${testId}"`);
    return el;
  });
}

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
    onEditKpi: async () => ({ success: true }),
    onDeleteKpi: async () => ({ success: true }),
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

// These tests cover the answer to "how can I edit/delete a KPI?": every KPI now
// exposes an overflow "manage" menu (in the list and the detail header) offering
// Edit and Delete, gated on canManage.
describe("SpaceKpisPage edit & delete", () => {
  test("each KPI row exposes a manage menu with Edit and Delete", async () => {
    const user = userEvent.setup();
    const target = mockKpis[0]!;
    const { container } = renderPage();

    await user.click(container.querySelector(`[data-test-id="kpi-actions-${target.id}"]`)!);

    await waitFor(() => {
      expect(document.querySelector(`[data-test-id="edit-kpi-${target.id}"]`)).toBeInTheDocument();
      expect(document.querySelector(`[data-test-id="delete-kpi-${target.id}"]`)).toBeInTheDocument();
    });
  });

  test("choosing Edit opens the edit form pre-filled with the KPI", async () => {
    const user = userEvent.setup();
    const target = mockKpis[0]!;
    const { container } = renderPage();

    await user.click(container.querySelector(`[data-test-id="kpi-actions-${target.id}"]`)!);
    await user.click(await findByTestId(`edit-kpi-${target.id}`));

    // The edit modal opens with the KPI's current name and unit already filled in.
    expect(await findByTestId("edit-kpi-modal")).toBeInTheDocument();
    expect(screen.getByDisplayValue(target.name)).toBeInTheDocument();
    expect(screen.getByDisplayValue(target.unit)).toBeInTheDocument();
  });

  test("choosing Delete opens a confirmation that calls onDeleteKpi", async () => {
    const user = userEvent.setup();
    const onDeleteKpi = jest.fn().mockResolvedValue({ success: true });
    const target = mockKpis[0]!;
    const { container } = renderPage({ onDeleteKpi });

    await user.click(container.querySelector(`[data-test-id="kpi-actions-${target.id}"]`)!);
    await user.click(await findByTestId(`delete-kpi-${target.id}`));

    expect(await findByTestId("delete-kpi-modal")).toBeInTheDocument();

    await user.click(await findByTestId("confirm-delete-kpi"));

    await waitFor(() => expect(onDeleteKpi).toHaveBeenCalledWith(target.id));
  });

  test("the detail header exposes the same manage menu for the open KPI", async () => {
    const user = userEvent.setup();
    const target = mockKpis[0]!;
    const { container } = renderPage({ initialSelectedKpiId: target.id });

    await user.click(container.querySelector(`[data-test-id="kpi-actions-${target.id}"]`)!);

    await waitFor(() => {
      expect(document.querySelector(`[data-test-id="edit-kpi-${target.id}"]`)).toBeInTheDocument();
      expect(document.querySelector(`[data-test-id="delete-kpi-${target.id}"]`)).toBeInTheDocument();
    });
  });

  test("read-only viewers get no manage menu on rows or the detail header", () => {
    const target = mockKpis[0]!;

    const list = renderPage({ canManage: false });
    expect(list.container.querySelector(`[data-test-id="kpi-actions-${target.id}"]`)).not.toBeInTheDocument();
    list.unmount();

    const detail = renderPage({ canManage: false, initialSelectedKpiId: target.id });
    expect(detail.container.querySelector(`[data-test-id="kpi-actions-${target.id}"]`)).not.toBeInTheDocument();
  });
});
