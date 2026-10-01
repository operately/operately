import React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { RelativeDayField } from ".";
import { i18n, setupTestCatalog } from "../../test/i18n";

describe("relative-day translations", () => {
  afterEach(cleanup);
  setupTestCatalog();

  it.each([0, 1, 5])("renders the Portuguese catalog for %s days", async (count) => {
    await i18n.changeLanguage("pt-BR");
    render(<RelativeDayField value={count} readonly />);
    const expected =
      count === 0
        ? "Na data de início do projeto"
        : count === 1
          ? "1 dia após o início do projeto"
          : "5 dias após o início do projeto";
    expect(screen.getByRole("button")).toHaveTextContent(expected);
  });

  it.each([0, 1, 5])("falls back to English for %s days when Portuguese is missing", async (count) => {
    i18n.removeResourceBundle("pt-BR", "translation");
    await i18n.changeLanguage("pt-BR");
    render(<RelativeDayField value={count} readonly />);
    expect(screen.getByRole("button")).toHaveTextContent(
      count === 0
        ? "On the project start date"
        : count === 1
          ? "1 day after project starts"
          : "5 days after project starts",
    );
  });

  it("updates an already rendered field when the language changes", async () => {
    render(<RelativeDayField value={2} readonly />);
    await act(async () => {
      await i18n.changeLanguage("pt-BR");
    });
    expect(screen.getByRole("button")).toHaveTextContent("2 dias após o início do projeto");
  });
});

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
    render(<RelativeDayField value={20} onChange={jest.fn()} testId="relative-day-field" />);

    fireEvent.click(document.querySelector('[data-test-id="relative-day-field"] button')!);
    const input = document.querySelector('[data-test-id="relative-day-field-input"]');

    expect(input).not.toHaveClass("flex-1");
    expect(input?.nextElementSibling).toHaveTextContent("days");
    expect(input?.parentElement).toHaveClass("gap-1");
  });

  it("still stretches the form-field input across the control", () => {
    render(<RelativeDayField variant="form-field" value={20} onChange={jest.fn()} testId="relative-day-field" />);

    fireEvent.click(document.querySelector('[data-test-id="relative-day-field"] button')!);

    expect(document.querySelector('[data-test-id="relative-day-field-input"]')).toHaveClass("flex-1");
  });

  it("can hide the calendar icon on the trigger", () => {
    render(<RelativeDayField value={null} onChange={jest.fn()} hideCalendarIcon />);

    expect(screen.getByRole("button", { name: "Set relative date" }).querySelector("svg")).toBeNull();
  });

  it("applies className to the trigger button", () => {
    render(<RelativeDayField value={null} onChange={jest.fn()} className="[&>span]:text-transparent" />);

    expect(screen.getByRole("button", { name: "Set relative date" })).toHaveClass("[&>span]:text-transparent");
  });

  it("opens for editing when a parent sets isOpen", () => {
    render(<RelativeDayField value={1} onChange={jest.fn()} isOpen />);

    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("notifies the parent when editing starts", () => {
    const onOpenChange = jest.fn();
    render(<RelativeDayField value={1} onChange={jest.fn()} isOpen={false} onOpenChange={onOpenChange} />);

    fireEvent.click(screen.getByText("1 day after project starts"));

    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.queryByRole("textbox")).toBeNull();
  });
});
