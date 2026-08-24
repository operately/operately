import * as React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { LogUpdateForm } from "./LogUpdateForm";
import type { SpaceKpisPage } from "./types";

// This codebase tags elements with `data-test-id` (not the default
// `data-testid`); resolve them via the attribute selector.
function getByTestId(testId: string): HTMLElement {
  const el = document.querySelector<HTMLElement>(`[data-test-id="${testId}"]`);
  if (!el) throw new Error(`Could not find element with data-test-id="${testId}"`);
  return el;
}

// Local `YYYY-MM-DD` for today, mirroring the form's default so assertions stay
// timezone-agnostic in CI.
function today(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60 * 1000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

const kpi: SpaceKpisPage.Kpi = {
  id: "kpi-signups",
  name: "Weekly Sign-ups",
  description: null,
  unit: "users",
  cadence: "weekly",
  champion: null,
  insertedAt: new Date(),
  link: "/spaces/space-growth/kpis/kpi-signups",
  latestEntry: null,
  entries: [],
};

function renderForm(overrides: Partial<React.ComponentProps<typeof LogUpdateForm>> = {}) {
  const onRecord = jest.fn().mockResolvedValue({ success: true });
  const props: React.ComponentProps<typeof LogUpdateForm> = {
    kpi,
    isOpen: true,
    onClose: () => {},
    onRecord,
    ...overrides,
  };
  render(<LogUpdateForm {...props} />);
  return { onRecord: props.onRecord as jest.Mock };
}

describe("LogUpdateForm date affordance", () => {
  test("defaults to today in a low-prominence summary and submits without touching the date", async () => {
    const user = userEvent.setup();
    const { onRecord } = renderForm();

    // The date is shown as a compact "Logging for today" summary, not a
    // full-size labeled input matching the Value field.
    expect(getByTestId("log-update-period-summary")).toHaveTextContent("Logging for today");
    expect(document.querySelector('[data-test-id="log-update-period"]')).not.toBeInTheDocument();

    fireEvent.change(getByTestId("value"), { target: { value: "42" } });
    await user.click(getByTestId("submit"));

    await waitFor(() =>
      expect(onRecord).toHaveBeenCalledWith({ kpiId: kpi.id, value: 42, period: today() }),
    );
  });

  test("'Change date' reveals and focuses the date input", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(getByTestId("log-update-change-date"));

    const dateInput = getByTestId("log-update-period");
    expect(dateInput).toBeInTheDocument();
    await waitFor(() => expect(dateInput).toHaveFocus());

    // The revealed input carries a user-friendly "Date" label — not the
    // internal "Period" terminology — while keeping the `period` id/field.
    const label = document.querySelector('label[for="kpi-entry-period"]');
    expect(label).toHaveTextContent("Date");
    expect(label).not.toHaveTextContent("Period");
  });

  test("submitting after changing the date sends the chosen period", async () => {
    const user = userEvent.setup();
    const { onRecord } = renderForm();

    fireEvent.change(getByTestId("value"), { target: { value: "7" } });
    await user.click(getByTestId("log-update-change-date"));
    fireEvent.change(getByTestId("log-update-period"), { target: { value: "2026-01-15" } });
    await user.click(getByTestId("submit"));

    await waitFor(() =>
      expect(onRecord).toHaveBeenCalledWith({ kpiId: kpi.id, value: 7, period: "2026-01-15" }),
    );
  });
});
