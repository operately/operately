import * as React from "react";
import { fireEvent, render } from "@testing-library/react";
import "@testing-library/jest-dom";

import { KpiLineChart } from "./KpiLineChart";
import type { SpaceKpisPage } from "./types";
import { formatShortDate } from "./utils";

function entry(id: string, value: number): SpaceKpisPage.KpiEntry {
  return { id, value, recordedAt: new Date(`2026-01-0${id}`), recordedBy: null, commentsCount: 0 };
}

describe("KpiLineChart y-axis", () => {
  // A high-baseline, low-variance series (all values ~800-850). With an
  // auto-scaled minimum the tiny fluctuations would be visually exaggerated;
  // the axis minimum must instead be pinned at 0 so the line reads flat.
  test("pins the y-axis minimum at 0 for a high-baseline dataset", () => {
    const entries = [entry("1", 810), entry("2", 848), entry("3", 802), entry("4", 835)];

    const { container } = render(<KpiLineChart entries={entries} unit="users" />);

    const axisMin = container.querySelector('[data-test-id="kpi-chart-y-axis-min"]');
    expect(axisMin).toBeInTheDocument();
    expect(axisMin).toHaveTextContent("0");
    // Guard against the old behaviour where the minimum tracked the data's min.
    expect(axisMin).not.toHaveTextContent("800");
  });

  test("still auto-scales the maximum to fit the largest value", () => {
    const entries = [entry("1", 810), entry("2", 848), entry("3", 802), entry("4", 835)];

    const { container } = render(<KpiLineChart entries={entries} unit="users" />);

    const numericLabels = Array.from(container.querySelectorAll("text"))
      .map((t) => Number(String(t.textContent).replace(/K$/, "e3").replace(/M$/, "e6")))
      .filter((n) => !Number.isNaN(n));

    // The top gridline must comfortably clear the largest value (848).
    expect(Math.max(...numericLabels)).toBeGreaterThanOrEqual(848);
  });
});

describe("KpiLineChart x-axis", () => {
  function entryOn(id: string, date: Date): SpaceKpisPage.KpiEntry {
    return { id, value: 100, recordedAt: date, recordedBy: null, commentsCount: 0 };
  }

  function axisLabels(entries: SpaceKpisPage.KpiEntry[]): string[] {
    const { container } = render(<KpiLineChart entries={entries} unit="users" />);

    return Array.from(container.querySelectorAll('[data-test-id="kpi-chart-x-axis-tick"] text')).map((node) =>
      String(node.textContent),
    );
  }

  // The old axis labelled only the first and last entry, which left a
  // multi-year series with no way to tell where any middle point sits in time.
  test("labels dates between the first and last entry", () => {
    const labels = axisLabels([
      entryOn("1", new Date(2024, 2, 1)),
      entryOn("2", new Date(2025, 5, 1)),
      entryOn("3", new Date(2026, 7, 15)),
    ]);

    expect(labels.length).toBeGreaterThan(2);
  });

  // A lone "Jul" between two years leaves the reader inferring which July it is
  // from a neighbouring label.
  test("names the year on every axis label of a multi-year series", () => {
    const labels = axisLabels([entryOn("1", new Date(2024, 2, 1)), entryOn("2", new Date(2026, 7, 15))]);

    expect(labels.length).toBeGreaterThan(1);
    labels.forEach((label) => expect(label).toMatch(/\d{4}/));
  });

  test("keeps every axis label inside the chart viewport", () => {
    const { container } = render(
      <KpiLineChart entries={[entryOn("1", new Date(2024, 2, 1)), entryOn("2", new Date(2026, 7, 15))]} unit="users" />,
    );

    const labels = Array.from(container.querySelectorAll('[data-test-id="kpi-chart-x-axis-tick"] text'));
    expect(labels.length).toBeGreaterThan(0);

    labels.forEach((label) => {
      const x = Number(label.getAttribute("x"));
      const anchor = label.getAttribute("text-anchor");

      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(640);
      if (x < 78) expect(anchor).toBe("start");
      if (x > 590) expect(anchor).toBe("end");
    });
  });

  test("includes the year in tooltips when the series spans more than one year", () => {
    const entries = [entryOn("1", new Date(2024, 2, 1)), entryOn("2", new Date(2026, 7, 15))];
    const { container } = render(<KpiLineChart entries={entries} unit="users" />);

    fireEvent.mouseEnter(container.querySelector('[data-test-id="kpi-chart-hover-band-0"]')!);

    expect(container.querySelector('[data-test-id="kpi-chart-tooltip"]')).toHaveTextContent("2024");
  });
});

describe("KpiLineChart hover", () => {
  const entries = [entry("1", 810), entry("2", 848), entry("3", 802)];

  function renderChart() {
    return render(<KpiLineChart entries={entries} unit="users" />);
  }

  test("shows no tooltip until a point is hovered", () => {
    const { container } = renderChart();

    expect(container.querySelector('[data-test-id="kpi-chart-tooltip"]')).not.toBeInTheDocument();
  });

  test("shows the hovered entry's value and date", () => {
    const { container } = renderChart();

    fireEvent.mouseEnter(container.querySelector('[data-test-id="kpi-chart-hover-band-1"]')!);

    const tooltip = container.querySelector('[data-test-id="kpi-chart-tooltip"]');
    expect(tooltip).toHaveTextContent("848 users");
    expect(tooltip).toHaveTextContent(formatShortDate(entries[1]!.recordedAt));
  });

  test("switches to the next entry when the pointer moves across the chart", () => {
    const { container } = renderChart();

    fireEvent.mouseEnter(container.querySelector('[data-test-id="kpi-chart-hover-band-0"]')!);
    fireEvent.mouseEnter(container.querySelector('[data-test-id="kpi-chart-hover-band-2"]')!);

    expect(container.querySelector('[data-test-id="kpi-chart-tooltip"]')).toHaveTextContent("802 users");
  });

  test("hides the tooltip when the pointer leaves the chart", () => {
    const { container } = renderChart();

    fireEvent.mouseEnter(container.querySelector('[data-test-id="kpi-chart-hover-band-0"]')!);
    fireEvent.mouseLeave(container.querySelector("svg")!);

    expect(container.querySelector('[data-test-id="kpi-chart-tooltip"]')).not.toBeInTheDocument();
  });

  test("keeps a long-unit tooltip inside the SVG viewport", () => {
    const { container } = render(
      <KpiLineChart entries={entries} unit={"very-long-kpi-unit-name-that-would-overflow-the-chart".repeat(3)} />,
    );

    fireEvent.mouseEnter(container.querySelector('[data-test-id="kpi-chart-hover-band-0"]')!);

    const box = container.querySelector('[data-test-id="kpi-chart-tooltip"] rect');
    expect(box).toBeInTheDocument();

    const x = Number(box!.getAttribute("x"));
    const width = Number(box!.getAttribute("width"));
    expect(x).toBeGreaterThanOrEqual(0);
    expect(x + width).toBeLessThanOrEqual(640);
  });
});

describe("KpiLineChart annotations", () => {
  const entries = [entry("1", 810), entry("2", 848), entry("3", 802)];
  const annotations: SpaceKpisPage.KpiAnnotation[] = [
    {
      id: "ann-1",
      date: new Date("2026-01-02"),
      title: "Launched enterprise plan",
      createdBy: null,
    },
  ];

  test("renders a marker for each annotation", () => {
    const { container } = render(<KpiLineChart entries={entries} unit="users" annotations={annotations} />);

    expect(container.querySelector('[data-test-id="kpi-chart-annotation-ann-1"]')).toBeInTheDocument();
  });

  test("shows the annotation title and date on hover", () => {
    const { container } = render(<KpiLineChart entries={entries} unit="users" annotations={annotations} />);

    fireEvent.mouseEnter(container.querySelector('[data-test-id="kpi-chart-annotation-hit-ann-1"]')!);

    const tooltip = container.querySelector('[data-test-id="kpi-chart-annotation-tooltip"]');
    expect(tooltip).toHaveTextContent("Launched enterprise plan");
    expect(tooltip).toHaveTextContent(formatShortDate(annotations[0]!.date));
  });
});
