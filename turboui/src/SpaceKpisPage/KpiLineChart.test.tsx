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
      description: "First paid cohort went live",
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
    expect(tooltip).toHaveTextContent("First paid cohort went live");
  });
});
