import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { RelativeDayField } from ".";

describe("RelativeDayField", () => {
  it.each([
    [0, "On the project start date"],
    [1, "1 day after project starts"],
    [12, "12 days after project starts"],
  ])("formats %s days", (value, label) => {
    render(<RelativeDayField value={value} onChange={jest.fn()} />);

    expect(screen.getByText(label)).toBeTruthy();
  });

  it("renders its empty placeholder", () => {
    render(<RelativeDayField value={null} onChange={jest.fn()} placeholder="Set project duration" />);

    expect(screen.getByText("Set project duration")).toBeTruthy();
  });

  it("saves a valid value with Enter", () => {
    const onChange = jest.fn();
    render(<RelativeDayField value={1} onChange={onChange} />);

    fireEvent.click(screen.getByText("1 day after project starts"));
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "3" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("clears the value", () => {
    const onChange = jest.fn();
    render(<RelativeDayField value={4} onChange={onChange} />);

    fireEvent.click(screen.getByText("4 days after project starts"));
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("cancels changes with Escape", () => {
    const onChange = jest.fn();
    render(<RelativeDayField value={2} onChange={onChange} />);

    fireEvent.click(screen.getByText("2 days after project starts"));
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "8" } });
    fireEvent.keyDown(input, { key: "Escape" });

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText("2 days after project starts")).toBeTruthy();
  });

  it.each(["-1", "1.5", "not a number"])("rejects malformed input: %s", (inputValue) => {
    const onChange = jest.fn();
    render(<RelativeDayField value={null} onChange={onChange} />);

    fireEvent.click(screen.getByText("Set relative date"));
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: inputValue } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(screen.getByText("Enter zero or a positive number of days.")).toBeTruthy();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not enter edit mode when read-only", () => {
    render(<RelativeDayField value={5} readonly />);

    fireEvent.click(screen.getByText("5 days after project starts"));

    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("uses a full-width bordered control in the form-field variant", () => {
    render(<RelativeDayField variant="form-field" value={null} onChange={jest.fn()} />);

    expect(screen.getByRole("button", { name: "Set relative date" })).toHaveClass("w-full");
    expect(screen.getByRole("button", { name: "Set relative date" })).toHaveClass("border-surface-outline");
  });

  it("keeps the days suffix next to the inline input", () => {
    render(<RelativeDayField value={20} onChange={jest.fn()} />);

    fireEvent.click(screen.getByText("20 days after project starts"));
    const input = screen.getByRole("textbox");

    expect(input).not.toHaveClass("flex-1");
    expect(input.nextElementSibling).toHaveTextContent("days");
    expect(input.parentElement).toHaveClass("gap-1");
  });

  it("still stretches the form-field input across the control", () => {
    render(<RelativeDayField variant="form-field" value={20} onChange={jest.fn()} />);

    fireEvent.click(screen.getByText("20 days after project starts"));

    expect(screen.getByRole("textbox")).toHaveClass("flex-1");
  });

  it("can hide the calendar icon on the trigger", () => {
    render(<RelativeDayField value={null} onChange={jest.fn()} hideCalendarIcon />);

    expect(screen.getByRole("button", { name: "Set relative date" }).querySelector("svg")).toBeNull();
  });
});
