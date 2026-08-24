import * as React from "react";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";

import { createTestId } from "../TestableElement";
import { SpaceKpisPage } from "./index";
import type { SpaceKpisPage as SpaceKpisPageNS } from "./types";
import {
  mockChampionSearch,
  mockCurrentUser,
  mockKpis,
  mockLongChampionSearch,
  mockPeople,
  mockSpace,
} from "./mockData";

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

const kpisLink = `/spaces/${mockSpace.id}/kpis`;

// These tests guard the unified space-tool layout: the KPIs page should present
// the same page chrome (breadcrumb navigation + tool title + header action) as
// the other space tools rather than an in-page tab bar.
function pageProps(overrides: Partial<SpaceKpisPageNS.Props> = {}): SpaceKpisPageNS.Props {
  return {
    space: mockSpace,
    navigation: [{ to: `/spaces/${mockSpace.id}`, label: mockSpace.name }],
    kpisLink,
    kpis: mockKpis,
    currentUser: mockCurrentUser,
    championSearch: mockChampionSearch,
    onCreateKpi: async () => ({ success: true }),
    onEditKpi: async () => ({ success: true }),
    onDeleteKpi: async () => ({ success: true }),
    onRecordEntry: async () => ({ success: true }),
    ...overrides,
  };
}

function renderPage(overrides: Partial<SpaceKpisPageNS.Props> = {}) {
  return render(
    <MemoryRouter>
      <SpaceKpisPage {...pageProps(overrides)} />
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

  // Every KPI has its own page, so the list links to it instead of swapping the
  // content in place. That makes a KPI shareable: the link can be copied,
  // bookmarked, and opened in a new tab.
  test("each KPI in the list links to its own page", () => {
    renderPage();

    mockKpis.forEach((kpi) => {
      expect(screen.getByText(kpi.name).closest("a")).toHaveAttribute("href", kpi.link);
    });
  });

  test("opening a KPI moves its name into the header and swaps the primary action to 'Log update'", () => {
    const target = mockKpis[0]!;
    const { container } = renderPage({ selectedKpi: target });

    // KPI name becomes the header title...
    expect(screen.getByRole("heading", { name: target.name })).toBeInTheDocument();

    // ...and "KPIs" becomes a breadcrumb linking back to the list.
    const backCrumb = container.querySelector('[data-test-id="kpis-breadcrumb"]');
    expect(backCrumb).toHaveAttribute("href", kpisLink);

    // The header action is now "Log update", not "New KPI".
    expect(container.querySelector('[data-test-id="kpi-detail-log-update"]')).toBeInTheDocument();
    expect(container.querySelector('[data-test-id="new-kpi"]')).not.toBeInTheDocument();
  });

  test("shows KPI information in a sidebar beside its value and history", () => {
    const target = mockKpis[0]!;
    const { container } = renderPage({ selectedKpi: target });
    const sidebar = container.querySelector<HTMLElement>('[data-test-id="kpi-sidebar"]')!;

    expect(sidebar).toBeInTheDocument();
    expect(within(sidebar).getByText("Champion")).toBeInTheDocument();
    expect(within(sidebar).getByText(target.champion!.fullName)).toBeInTheDocument();
    expect(within(sidebar).getByText("Cadence")).toBeInTheDocument();
    expect(within(sidebar).getByText("Monthly")).toBeInTheDocument();
    expect(within(sidebar).queryByText("Unit")).not.toBeInTheDocument();
  });

  test("editors can change the champion from the sidebar", async () => {
    HTMLElement.prototype.scrollIntoView = jest.fn();

    const user = userEvent.setup();
    const target = mockKpis[0]!;
    const onEditKpi = jest.fn().mockResolvedValue({ success: true, id: target.id });
    const replacement = mockPeople.find((person) => person.id !== target.champion?.id)!;

    renderPage({ selectedKpi: target, onEditKpi });

    await user.click(await findByTestId("kpi-champion"));
    await user.click(await findByTestId("kpi-champion-assign-another"));
    await user.click(await findByTestId(createTestId("kpi-champion", "search-result", replacement.fullName)));

    await waitFor(() =>
      expect(onEditKpi).toHaveBeenCalledWith(expect.objectContaining({ id: target.id, championId: replacement.id })),
    );
  });

  test("a failed champion search leaves the picker usable and offers no stale names", async () => {
    HTMLElement.prototype.scrollIntoView = jest.fn();
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});

    const user = userEvent.setup();
    const target = mockKpis[0]!;
    const championSearch = jest.fn().mockRejectedValue(new Error("network down"));

    renderPage({ selectedKpi: target, championSearch });

    await user.click(await findByTestId("kpi-champion"));
    await user.click(await findByTestId("kpi-champion-assign-another"));

    // The rejection has to be caught here rather than escaping as an unhandled
    // promise, and the picker must offer nothing rather than stale names.
    await waitFor(() => expect(consoleError).toHaveBeenCalled());
    expect(document.querySelector('[data-test-id^="kpi-champion-search-result"]')).not.toBeInTheDocument();

    consoleError.mockRestore();
  });

  // A slow early search must not land last and offer people who don't match what
  // the user has since typed.
  test("a slow champion search does not override the results of a newer one", async () => {
    HTMLElement.prototype.scrollIntoView = jest.fn();

    const user = userEvent.setup();
    const target = mockKpis[0]!;
    const [stale, fresh] = mockPeople.filter((person) => person.id !== target.champion?.id);

    let resolveStale: (people: SpaceKpisPageNS.Person[]) => void = () => {};
    const championSearch = jest
      .fn()
      .mockImplementationOnce(() => new Promise<SpaceKpisPageNS.Person[]>((resolve) => (resolveStale = resolve)))
      .mockResolvedValue([fresh!]);

    renderPage({ selectedKpi: target, championSearch });

    await user.click(await findByTestId("kpi-champion"));
    await user.click(await findByTestId("kpi-champion-assign-another"));

    const search = screen.getByPlaceholderText("Search...");
    await user.type(search, "a");
    await waitFor(() => expect(championSearch).toHaveBeenCalledTimes(1));

    await user.type(search, "b");
    await waitFor(() => expect(championSearch).toHaveBeenCalledTimes(2));
    await findByTestId(createTestId("kpi-champion", "search-result", fresh!.fullName));

    await act(async () => {
      resolveStale([stale!]);
    });

    expect(
      document.querySelector(`[data-test-id="${createTestId("kpi-champion", "search-result", stale!.fullName)}"]`),
    ).not.toBeInTheDocument();
    expect(await findByTestId(createTestId("kpi-champion", "search-result", fresh!.fullName))).toBeInTheDocument();
  });

  test("read-only viewers cannot change the champion from the sidebar", () => {
    const target = mockKpis[0]!;
    const { container } = renderPage({ selectedKpi: target, canManage: false });

    expect(container.querySelector('[data-test-id="kpi-champion"]')).toBeInTheDocument();
    expect(container.querySelector('[data-test-id="kpi-champion"]')?.tagName).toBe("A");
  });

  test("editors can change the cadence from the sidebar", async () => {
    const user = userEvent.setup();
    const target = mockKpis[0]!;
    const onEditKpi = jest.fn().mockResolvedValue({ success: true, id: target.id });

    renderPage({ selectedKpi: target, onEditKpi });

    await user.click(await findByTestId("kpi-cadence"));
    await user.click(await findByTestId("kpi-cadence-weekly"));

    await waitFor(() =>
      expect(onEditKpi).toHaveBeenCalledWith(expect.objectContaining({ id: target.id, cadence: "weekly" })),
    );
  });

  test("read-only viewers cannot change the cadence from the sidebar", () => {
    const target = mockKpis[0]!;
    const { container } = renderPage({ selectedKpi: target, canManage: false });

    expect(container.querySelector('[data-test-id="kpi-cadence"]')?.tagName).not.toBe("BUTTON");
    expect(container.querySelector('[data-test-id="kpi-cadence-weekly"]')).not.toBeInTheDocument();
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
      link: `${kpisLink}/kpi-throughput`,
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
    const { container } = renderPage({ selectedKpi: target });

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

    const detail = renderPage({ canManage: false, selectedKpi: target });
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

  // The open KPI comes from the route loader, so a logged entry reaches the
  // chart when the page re-renders with refreshed route data. This harness
  // stands in for that refresh.
  test("logging an entry from the detail view updates the chart once the route data refreshes", async () => {
    const user = userEvent.setup();

    // Start from a KPI with a single entry (single-point card), then log a
    // second one so the history becomes a multi-point line chart.
    const base = mockKpis.find((kpi) => kpi.id === "kpi-signups")!;

    function Harness() {
      const [kpi, setKpi] = React.useState(base);

      const onRecordEntry = async (input: SpaceKpisPageNS.RecordEntryInput) => {
        const entry = { id: "new-entry", value: input.value, recordedAt: new Date(), recordedBy: null };
        setKpi((current) => ({ ...current, entries: [...current.entries, entry] }));

        return { success: true };
      };

      return <SpaceKpisPage {...pageProps({ selectedKpi: kpi, onRecordEntry })} />;
    }

    const { container } = render(
      <MemoryRouter>
        <Harness />
      </MemoryRouter>,
    );

    // Single entry → single-value card, no trend line yet.
    await findByTestId("kpi-line-chart-single");

    await user.click(container.querySelector('[data-test-id="kpi-detail-log-update"]')!);
    fireEvent.change(await findByTestId("value"), { target: { value: "500" } });
    await user.click(await findByTestId("log-update-change-date"));
    fireEvent.change(await findByTestId("log-update-period"), { target: { value: "2026-07-30" } });
    await user.click(await findByTestId("submit"));

    // With the refreshed KPI there are two entries, so the chart plots a line.
    await findByTestId("kpi-line-chart");
  });
});
