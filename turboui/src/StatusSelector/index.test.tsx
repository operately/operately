import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { StatusSelector } from "./index";

const statuses = [
  { id: "in_progress", value: "in_progress", label: "In progress", icon: "circleDot", color: "blue", index: 0 },
] as const satisfies ReadonlyArray<StatusSelector.StatusOption>;

describe("StatusSelector", () => {
  it("keeps the default trigger as a compact control", () => {
    render(
      <StatusSelector
        statusOptions={statuses}
        status={statuses[0]}
        onChange={jest.fn()}
        showFullBadge
        testId="status-selector"
      />,
    );

    const trigger = document.querySelector('[data-test-id="status-selector"]');
    expect(trigger).not.toHaveClass("border-surface-outline");
    expect(trigger).not.toHaveClass("w-full");
  });

  it("uses a form-field trigger that fills the bordered box", () => {
    render(
      <StatusSelector
        variant="form-field"
        statusOptions={statuses}
        status={statuses[0]}
        onChange={jest.fn()}
        testId="status-selector"
      />,
    );

    const trigger = document.querySelector('[data-test-id="status-selector"]');
    expect(trigger).toHaveClass("border-surface-outline");
    expect(trigger).toHaveClass("w-full");
    expect(trigger).toHaveTextContent("In progress");
  });

  it("uses a consistent focus ring and matches the form-field width", async () => {
    render(
      <StatusSelector
        variant="form-field"
        statusOptions={statuses}
        status={statuses[0]}
        onChange={jest.fn()}
        testId="status-selector"
      />,
    );

    const trigger = document.querySelector('[data-test-id="status-selector"]');
    expect(trigger).toHaveClass("focus:ring-brand-1");

    fireEvent.click(trigger!);

    const searchInput = await screen.findByPlaceholderText("Change status...");
    expect(searchInput).toHaveClass("focus:outline-none", "focus:ring-2", "focus:ring-brand-1");
    expect(searchInput.closest("[data-side]")).toHaveClass("w-[var(--radix-popover-trigger-width)]");
  });
});
