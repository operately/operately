import * as React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { DateField } from ".";

describe("DateField variants", () => {
  it("matches conventional form inputs in the form-input variant", () => {
    render(<DateField variant="form-input" placeholder="Select a date" ariaLabel="Project start date" />);

    const trigger = screen.getByRole("button", { name: "Project start date" });
    const content = trigger.firstElementChild;

    expect(trigger).toHaveClass("flex", "w-full", "bg-surface-base", "px-3", "py-1.5");
    expect(content).toHaveClass("w-full", "justify-between");
    expect(content?.firstElementChild).toHaveTextContent("Select a date");
    expect(content?.lastElementChild?.tagName).toBe("svg");
    expect(content).not.toHaveClass("text-sm");
  });

  it("keeps the existing form-field layout unchanged", () => {
    render(<DateField variant="form-field" placeholder="Set due date" ariaLabel="Due date" />);

    const trigger = screen.getByRole("button", { name: "Due date" });
    const content = trigger.firstElementChild;

    expect(trigger.parentElement).toHaveClass("inline-block");
    expect(content).toHaveClass("text-sm");
    expect(content).not.toHaveClass("justify-between");
    expect(content?.firstElementChild?.tagName).toBe("svg");
  });
});
