import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";

import { SpaceKpisPage } from "./index";
import type { SpaceKpisPage as SpaceKpisPageNS } from "./types";
import { mockChampionSearch, mockCurrentUser, mockKpis, mockLongChampionSearch, mockSpace } from "./mockData";

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
    <MemoryRouter>
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
describe("SpaceKpisPage list latest value", () => {
  // The list endpoint omits full history but carries `latestEntry`; the list
  // must render that value rather than "No data".
  test("shows the latest value from latestEntry even when entries is empty", () => {
    const kpi: SpaceKpisPageNS.Kpi = {
      id: "kpi-throughput",
      name: "PR Throughput",
      unit: "USD",
      cadence: "weekly",
      champion: null,
      insertedAt: new Date(),
      latestEntry: { id: "e1", value: 123, recordedAt: new Date(), recordedBy: null },
      entries: [],
    };

    const { container } = renderPage({ kpis: [kpi] });

    const row = container.querySelector(`[data-test-id="kpi-row-${kpi.id}"]`)!;
    expect(row).toHaveTextContent("123 USD");
    expect(row).not.toHaveTextContent("No data");
  });
});

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

// These tests cover the write flows wired to the real GraphQL mutations:
// creating a KPI, and logging a single entry (value + period) that refreshes
// the detail chart.
describe("SpaceKpisPage create & log", () => {
  test("creating a KPI submits the entered fields to onCreateKpi", async () => {
    const user = userEvent.setup();
    const onCreateKpi = jest.fn().mockResolvedValue({ success: true, id: "new" });
    const { container } = renderPage({ onCreateKpi });

    await user.click(container.querySelector('[data-test-id="new-kpi"]')!);
    await findByTestId("new-kpi-modal");

    fireEvent.change(await findByTestId("name"), { target: { value: "Weekly Sign-ups" } });
    fireEvent.change(await findByTestId("unit"), { target: { value: "users" } });
    await user.click(await findByTestId("submit"));

    await waitFor(() =>
      expect(onCreateKpi).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Weekly Sign-ups", unit: "users", cadence: "monthly", championId: null }),
      ),
    );
  });

  // Regression: the champion dropdown used to be clipped by the modal's
  // `overflow-auto` when the option list was taller than the modal. With
  // `portalMenu`, the menu renders in a body-level portal outside the modal
  // element rather than being cut off by its scroll boundary.
  test("the champion dropdown renders its full list in a body portal, not clipped inside the modal", async () => {
    const user = userEvent.setup();
    const { container } = renderPage({ championSearch: mockLongChampionSearch });

    await user.click(container.querySelector('[data-test-id="new-kpi"]')!);
    const modal = await findByTestId("new-kpi-modal");

    // Open the Champion picker (react-select's text input inside the field).
    const championField = await findByTestId("championid");
    await user.click(championField.querySelector("input")!);

    // SelectPerson debounces search by 500ms; allow extra headroom for CI runners.
    await waitFor(
      () => {
        expect(document.querySelectorAll('[data-test-id^="person-option"]').length).toBeGreaterThanOrEqual(15);
      },
      { timeout: 5000 },
    );

    const options = document.querySelectorAll('[data-test-id^="person-option"]');
    options.forEach((option) => expect(modal.contains(option)).toBe(false));
  });

  test("logging an update submits the value and period to onRecordEntry", async () => {
    const user = userEvent.setup();
    const onRecordEntry = jest.fn().mockResolvedValue({ success: true });
    const target = mockKpis[0]!;
    const { container } = renderPage({ onRecordEntry });

    await user.click(container.querySelector(`[data-test-id="log-update-${target.id}"]`)!);
    await findByTestId("log-update-modal");

    fireEvent.change(await findByTestId("value"), { target: { value: "123" } });
    await user.click(await findByTestId("log-update-change-date"));
    fireEvent.change(await findByTestId("log-update-period"), { target: { value: "2026-07-15" } });
    await user.click(await findByTestId("submit"));

    await waitFor(() =>
      expect(onRecordEntry).toHaveBeenCalledWith({ kpiId: target.id, value: 123, period: "2026-07-15" }),
    );
  });

  test("logging an entry reloads the detail so the chart reflects the new value", async () => {
    const user = userEvent.setup();

    // Start from a KPI with a single entry (single-point card), then log a
    // second one so the history becomes a multi-point line chart.
    const base = mockKpis.find((kpi) => kpi.id === "kpi-signups")!;
    let entries = base.entries;

    const onLoadKpi = jest.fn(async () => ({ ...base, entries: [...entries] }));
    const onRecordEntry = jest.fn(async () => {
      entries = [...entries, { id: "new-entry", value: 500, recordedAt: new Date(), recordedBy: null }];
      return { success: true };
    });

    const { container } = renderPage({ initialSelectedKpiId: base.id, onLoadKpi, onRecordEntry });

    // Single entry → single-value card, no trend line yet.
    await findByTestId("kpi-line-chart-single");

    await user.click(container.querySelector('[data-test-id="kpi-detail-log-update"]')!);
    fireEvent.change(await findByTestId("value"), { target: { value: "500" } });
    await user.click(await findByTestId("log-update-change-date"));
    fireEvent.change(await findByTestId("log-update-period"), { target: { value: "2026-07-30" } });
    await user.click(await findByTestId("submit"));

    // After logging, the detail reloads and the chart now plots a line.
    await findByTestId("kpi-line-chart");
    expect(onLoadKpi).toHaveBeenCalledTimes(2);
  });
});
