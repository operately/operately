import * as React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";

import { KpiLineChart } from "./KpiLineChart";
import type { SpaceKpisPage } from "./types";

function entry(id: string, value: number): SpaceKpisPage.KpiEntry {
  return { id, value, recordedAt: new Date(`2026-01-0${id}`), recordedBy: null };
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
