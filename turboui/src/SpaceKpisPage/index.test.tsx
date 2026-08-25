import * as React from "react";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";

import { createTestId } from "../TestableElement";
import { createMockRichEditorHandlers } from "../utils/storybook/richEditor";
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
import { formatNumber, formatShortDate, formatValue } from "./utils";

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
    onDescriptionChange: async () => true,
    onDeleteKpi: async () => ({ success: true }),
    onRecordEntry: async () => ({ success: true }),
    richTextHandlers: createMockRichEditorHandlers(),
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

  // Champion, history, and latest value sit inside the same <a> as the name, so
  // clicking anywhere on the row opens the KPI.
  test("the whole row is the link to the KPI's page", () => {
    const target = mockKpis[0]!;
    const { container } = renderPage();
    const row = container.querySelector(`[data-test-id="kpi-row-${target.id}"]`)!;

    expect(row.tagName).toBe("A");
    expect(row).toHaveAttribute("href", target.link);
    expect(row).toHaveTextContent(target.champion!.fullName);
    expect(row).toHaveTextContent(formatNumber(target.latestEntry!.value));
  });

  // The KPI's name leads its own page rather than sitting in the compact tool
  // header, so the page reads name -> description -> history.
  test("opening a KPI leads the page with its name and swaps the primary action to 'Log update'", () => {
    const target = mockKpis[0]!;
    const { container } = renderPage({ selectedKpi: target });

    expect(screen.getByRole("heading", { name: target.name })).toBeInTheDocument();

    const heading = container.querySelector('[data-test-id="kpi-heading"]')!;
    const description = container.querySelector('[data-test-id="kpi-description"]')!;
    expect(heading.compareDocumentPosition(description) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    // The header keeps only the trail back to the list, not the name.
    const header = container.querySelector<HTMLElement>("header")!;
    expect(header).not.toHaveTextContent(target.name);
    expect(header.querySelector('[data-test-id="kpis-breadcrumb"]')).toHaveAttribute("href", kpisLink);

    // The header action is now "Log update", not "New KPI".
    expect(header.querySelector('[data-test-id="kpi-detail-log-update"]')).toBeInTheDocument();
    expect(container.querySelector('[data-test-id="new-kpi"]')).not.toBeInTheDocument();
  });

  test("shows KPI information in a sidebar beside its history", () => {
    const target = mockKpis[0]!;
    const { container } = renderPage({ selectedKpi: target });
    const sidebar = container.querySelector<HTMLElement>('[data-test-id="kpi-sidebar"]')!;

    expect(sidebar).toBeInTheDocument();
    expect(within(sidebar).getByText("Champion")).toBeInTheDocument();
    expect(within(sidebar).getByText(target.champion!.fullName)).toBeInTheDocument();
    expect(within(sidebar).getByText("Cadence")).toBeInTheDocument();
    expect(within(sidebar).getByText("Monthly")).toBeInTheDocument();
    expect(within(sidebar).getByText("Unit")).toBeInTheDocument();
    expect(sidebar.querySelector('[data-test-id="kpi-unit"]')).toHaveTextContent(target.unit);
  });

  test("shows a subscribe control in the sidebar on a KPI page", () => {
    const target = mockKpis[0]!;
    renderPage({
      selectedKpi: target,
      subscriptions: {
        isSubscribed: false,
        onToggle: () => {},
        hidden: false,
        entityType: "kpi",
      },
    });

    expect(screen.getByRole("button", { name: "Subscribe" })).toBeInTheDocument();
    expect(screen.getByText("You're not receiving notifications from this KPI.")).toBeInTheDocument();
  });

  test("shows the KPI description above its history", () => {
    const target = mockKpis[0]!;
    const { container } = renderPage({ selectedKpi: target });

    expect(container.querySelector('[data-test-id="kpi-description"]')).toHaveTextContent(
      "Tracks recurring revenue from active subscriptions at the end of each month.",
    );
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
  });

  test("lets editors add a missing description in place", async () => {
    const user = userEvent.setup();
    const target = mockKpis.find((kpi) => kpi.description === null)!;
    const { container } = renderPage({ selectedKpi: target });

    await user.click(within(container).getByText("Add a description..."));

    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  test("does not offer description editing to read-only viewers", () => {
    const target = mockKpis.find((kpi) => kpi.description === null)!;
    renderPage({ selectedKpi: target, canManage: false });

    expect(screen.queryByText("Add a description...")).not.toBeInTheDocument();
  });

  // The latest value is the newest point of the history chart, so it leads that
  // chart instead of being repeated elsewhere on the page. When it was recorded
  // is shown with it; by whom is left to the recorded-updates log.
  test("shows the current value at the head of the history chart", () => {
    const target = mockKpis[0]!;
    const latest = target.entries[target.entries.length - 1]!;
    const { container } = renderPage({ selectedKpi: target });
    const history = container.querySelector<HTMLElement>('[data-test-id="kpi-history"]')!;
    const value = history.querySelector<HTMLElement>('[data-test-id="kpi-current-value"]')!;

    expect(within(value).getByText(formatValue(latest.value, target.unit))).toBeInTheDocument();
    expect(value).toHaveTextContent(formatShortDate(latest.recordedAt));
  });

  // The value alone doesn't say whether the KPI is moving, so it carries the
  // signed change against the entry before it.
  test("shows the change against the previous entry beside the current value", () => {
    const target = mockKpis[0]!;
    const entries = target.entries;
    const delta = entries[entries.length - 1]!.value - entries[entries.length - 2]!.value;
    const { container } = renderPage({ selectedKpi: target });
    const value = container.querySelector<HTMLElement>('[data-test-id="kpi-current-value"]')!;

    expect(within(value).getByText(formatNumber(Math.abs(delta)))).toBeInTheDocument();
    expect(within(value).getByTitle(`+${formatNumber(Math.abs(delta))} vs previous`)).toBeInTheDocument();
  });

  test("shows no change indicator when a KPI has only one update", () => {
    const target = mockKpis.find((kpi) => kpi.entries.length === 1)!;
    const { container } = renderPage({ selectedKpi: target });
    const value = container.querySelector<HTMLElement>('[data-test-id="kpi-current-value"]')!;

    expect(within(value).getByText(formatValue(target.entries[0]!.value, target.unit))).toBeInTheDocument();
    expect(value.querySelector("[title$='vs previous']")).not.toBeInTheDocument();
  });

  // With nothing logged there is no reading to show, so the chart's empty state
  // carries the message on its own rather than pairing it with a blank value.
  test("shows no value at all when nothing has been logged", () => {
    const target = mockKpis.find((kpi) => kpi.entries.length === 0)!;
    const { container } = renderPage({ selectedKpi: target });

    expect(container.querySelector('[data-test-id="kpi-current-value"]')).not.toBeInTheDocument();
    expect(container.querySelector('[data-test-id="kpi-line-chart-empty"]')).toBeInTheDocument();
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

describe("SpaceKpisPage list latest value", () => {
  // The list endpoint omits full history but carries `latestEntry`; the list
  // must render that value rather than "No data".
  test("shows the latest value from latestEntry even when entries is empty", () => {
    const kpi: SpaceKpisPageNS.Kpi = {
      id: "kpi-throughput",
      name: "PR Throughput",
      description: null,
      unit: "USD",
      cadence: "weekly",
      champion: null,
      insertedAt: new Date(),
      link: `${kpisLink}/kpi-throughput`,
      latestEntry: { id: "e1", value: 123, recordedAt: new Date(), recordedBy: null, commentsCount: 0 },
      entries: [],
    };

    const { container } = renderPage({ kpis: [kpi] });

    const row = container.querySelector(`[data-test-id="kpi-row-${kpi.id}"]`)!;
    expect(row).toHaveTextContent("123");
    expect(row).not.toHaveTextContent("USD");
    expect(row).not.toHaveTextContent("No data");
  });

  // The list carries a bounded window of recent entries, so each row can show
  // where the KPI has been next to where it is now.
  test("plots the recent history inline for KPIs that have any", () => {
    const { container } = renderPage();
    const plotted = mockKpis.find((kpi) => kpi.entries.length > 1)!;
    const noHistory = mockKpis.find((kpi) => kpi.entries.length === 0)!;

    expect(container.querySelector(`[data-test-id="kpi-sparkline-${plotted.id}"]`)).toBeInTheDocument();
    expect(container.querySelector(`[data-test-id="kpi-sparkline-${noHistory.id}"]`)).not.toBeInTheDocument();
  });
});

// These tests cover the answer to "how can I edit or delete a KPI?": its fields
// are edited in place on its own page — the name in the page heading, the unit,
// cadence and champion in the sidebar — and deleting it is a sidebar action,
// the way a task page works. Nothing is tucked away behind an overflow menu.
describe("SpaceKpisPage edit & delete", () => {
  async function editInlineField(testId: string, value: string) {
    const user = userEvent.setup();

    await user.click(await findByTestId(testId));

    const input = await findByTestId(createTestId(testId, "input"));
    fireEvent.change(input, { target: { value } });

    // Enter saves, which fires the update mutation. Settle it here so its
    // result — including a rollback on failure — is applied inside act.
    await act(async () => {
      fireEvent.keyDown(input, { key: "Enter" });
    });
  }

  test("editors can rename a KPI from the page heading", async () => {
    const target = mockKpis[0]!;
    const onEditKpi = jest.fn().mockResolvedValue({ success: true, id: target.id });

    renderPage({ selectedKpi: target, onEditKpi });
    await editInlineField("kpi-name", "Net Revenue Retention");

    await waitFor(() =>
      expect(onEditKpi).toHaveBeenCalledWith(expect.objectContaining({ id: target.id, name: "Net Revenue Retention" })),
    );
  });

  test("editors can change the unit from the sidebar", async () => {
    const target = mockKpis[0]!;
    const onEditKpi = jest.fn().mockResolvedValue({ success: true, id: target.id });

    renderPage({ selectedKpi: target, onEditKpi });
    await editInlineField("kpi-unit", "EUR");

    await waitFor(() =>
      expect(onEditKpi).toHaveBeenCalledWith(expect.objectContaining({ id: target.id, unit: "EUR" })),
    );
  });

  // A rejected edit must not leave the page showing a value the server does not
  // have, so the field goes back to what it was.
  test("a rejected rename reverts the heading", async () => {
    const target = mockKpis[0]!;
    const onEditKpi = jest.fn().mockResolvedValue({ success: false, error: "Name is already taken" });

    renderPage({ selectedKpi: target, onEditKpi });
    await editInlineField("kpi-name", "Duplicate name");

    await waitFor(() => expect(screen.getByRole("heading", { name: target.name })).toBeInTheDocument());
  });

  test("the sidebar lists the KPI's actions: Copy URL and Delete", () => {
    const target = mockKpis[0]!;
    const { container } = renderPage({ selectedKpi: target });
    const sidebar = container.querySelector<HTMLElement>('[data-test-id="kpi-sidebar"]')!;

    expect(within(sidebar).getByText("Actions")).toBeInTheDocument();
    expect(within(sidebar).getByText("Copy URL")).toBeInTheDocument();
    expect(within(sidebar).getByText("Delete")).toBeInTheDocument();
  });

  test("Delete opens a confirmation that calls onDeleteKpi", async () => {
    const user = userEvent.setup();
    const onDeleteKpi = jest.fn().mockResolvedValue({ success: true });
    const target = mockKpis[0]!;

    renderPage({ selectedKpi: target, onDeleteKpi });

    await user.click(await findByTestId("delete-kpi"));
    expect(await findByTestId("delete-kpi-modal")).toBeInTheDocument();

    await user.click(await findByTestId("confirm-delete-kpi"));

    await waitFor(() => expect(onDeleteKpi).toHaveBeenCalledWith(target.id));
  });

  test("read-only viewers cannot rename a KPI or delete it", async () => {
    const user = userEvent.setup();
    const target = mockKpis[0]!;
    const { container } = renderPage({ canManage: false, selectedKpi: target });

    await user.click(await findByTestId("kpi-name"));
    expect(document.querySelector(`[data-test-id="${createTestId("kpi-name", "input")}"]`)).not.toBeInTheDocument();

    expect(container.querySelector('[data-test-id="delete-kpi"]')).not.toBeInTheDocument();
  });

  // Managing a KPI belongs on its own page, so list rows carry no actions.
  test("KPI rows have no 'Log update' action and no overflow menu", () => {
    const target = mockKpis[0]!;
    const { container } = renderPage();
    const row = container.querySelector<HTMLElement>(`[data-test-id="kpi-row-${target.id}"]`)!;

    expect(within(row).queryByText("Log update")).not.toBeInTheDocument();
    expect(within(row).queryByLabelText("KPI actions")).not.toBeInTheDocument();
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
    const { container } = renderPage({ selectedKpi: target, onRecordEntry });

    await user.click(container.querySelector('[data-test-id="kpi-detail-log-update"]')!);
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
        const entry = {
          id: "new-entry",
          value: input.value,
          recordedAt: new Date(),
          recordedBy: null,
          commentsCount: 0,
        };
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

describe("SpaceKpisPage KPI update comments", () => {
  test("opens comments on a recorded update in a slide-in", async () => {
    const user = userEvent.setup();
    const target = mockKpis[0]!;
    const entry = target.entries[target.entries.length - 1]!;

    renderPage({
      selectedKpi: target,
      canComment: true,
      renderEntryComments: () => <div data-test-id="entry-comments-body">Write a comment</div>,
    });

    await user.click(await findByTestId(`entry-comments-toggle-${entry.id}`));

    const slideIn = await findByTestId("entry-comments-slide-in");
    expect(slideIn).toHaveTextContent("Write a comment");

    const row = document.querySelector(`[data-test-id="entry-row-${entry.id}"]`);
    expect(row).not.toHaveTextContent("Write a comment");
  });

  // Opening the thread hides the table behind it, so the panel has to say which
  // update is being discussed: its value, who logged it, and when.
  test("names the update being commented on, with who logged it and when", async () => {
    const user = userEvent.setup();
    const target = mockKpis[0]!;
    const entry = target.entries[target.entries.length - 1]!;

    renderPage({ selectedKpi: target, canComment: true, renderEntryComments: () => null });

    await user.click(await findByTestId(`entry-comments-toggle-${entry.id}`));

    const header = await findByTestId("entry-comments-header");
    expect(header).toHaveTextContent(target.name);
    expect(header).toHaveTextContent(formatValue(entry.value, target.unit));
    expect(header).toHaveTextContent(entry.recordedBy!.fullName);
    expect(header).toHaveTextContent(formatShortDate(entry.recordedAt));
  });

  test("closes the update comments slide-in", async () => {
    const user = userEvent.setup();
    const target = mockKpis[0]!;
    const entry = target.entries[target.entries.length - 1]!;

    renderPage({
      selectedKpi: target,
      canComment: true,
      renderEntryComments: () => <div data-test-id="entry-comments-body">Write a comment</div>,
    });

    await user.click(await findByTestId(`entry-comments-toggle-${entry.id}`));
    await findByTestId("entry-comments-slide-in");
    await user.click(await findByTestId("slide-in-close-button"));

    await waitFor(() => {
      expect(document.querySelector('[data-test-id="entry-comments-slide-in"]')).not.toBeInTheDocument();
    });
  });
});
