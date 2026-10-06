import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { TimeframeSelectorDialog } from "./index";
import { CustomRangePicker } from "./CustomRangePicker";
import { MonthPicker } from "./MonthPicker";
import { QuarterPicker } from "./QuarterPicker";
import { YearPicker } from "./YearPicker";
import { formatTimeframe, type Timeframe } from "../utils/timeframes";
import { i18n, setupTestCatalog } from "../../test/i18n";

setupTestCatalog();
const timeframe: Timeframe = { startDate: new Date(2026, 0, 1), endDate: new Date(2026, 2, 31), type: "quarter" };

it("translates the dialog title, modes and quarter heading without changing identifiers", async () => {
  await i18n.changeLanguage("pt-BR");
  const setTimeframe = jest.fn();
  render(<TimeframeSelectorDialog open onOpenChange={jest.fn()} timeframe={timeframe} setTimeframe={setTimeframe} />);
  expect(screen.getByText("Selecionar período")).toBeInTheDocument();
  expect(screen.getByText("T1 2026")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Personalizado" }));
  expect(setTimeframe).toHaveBeenCalledWith({ ...timeframe, type: "days" });
});

it("localizes quarter ranges and retains end-of-quarter selection", async () => {
  await i18n.changeLanguage("pt-BR");
  const setTimeframe = jest.fn();
  render(<QuarterPicker timeframe={timeframe} setTimeframe={setTimeframe} />);
  expect(screen.getByText("1 de jan. – 31 de mar.")).toBeInTheDocument();
  fireEvent.click(screen.getByText("T2"));
  expect(setTimeframe).toHaveBeenCalledWith({
    ...timeframe,
    startDate: new Date(2026, 3, 1),
    endDate: new Date(2026, 5, 30),
  });
});

it("localizes month names and keeps the end of a leap-year February", async () => {
  await i18n.changeLanguage("pt-BR");
  const setTimeframe = jest.fn();
  render(
    <MonthPicker
      timeframe={{ ...timeframe, startDate: new Date(2024, 0, 1), type: "month" }}
      setTimeframe={setTimeframe}
    />,
  );
  fireEvent.click(screen.getByText("fevereiro"));
  expect(setTimeframe).toHaveBeenCalledWith(
    expect.objectContaining({ startDate: new Date(2024, 1, 1), endDate: new Date(2024, 1, 29) }),
  );
  expect(screen.getByRole("button", { name: "Próximo ano" })).toBeInTheDocument();
});

it("localizes custom date labels and navigation", async () => {
  await i18n.changeLanguage("pt-BR");
  render(<CustomRangePicker timeframe={timeframe} setTimeframe={jest.fn()} />);
  expect(screen.getByText(i18n.t("Due Date"))).toBeInTheDocument();
  expect(screen.getByText(i18n.t("Start Date"))).toBeInTheDocument();
  const nextMonth = screen.getAllByRole("button", { name: "Próximo mês" }).at(0);
  if (!nextMonth) throw new Error("Missing next-month action");
  fireEvent.click(nextMonth);
  expect(screen.getByText("fev. de 2026")).toBeInTheDocument();
});

it("keeps year selection and supports translated navigation labels", () => {
  i18n.addResourceBundle("en", "translation", { "Next year": "Translated next year" }, true, true);
  const setTimeframe = jest.fn();
  render(<YearPicker timeframe={{ ...timeframe, type: "year" }} setTimeframe={setTimeframe} />);
  expect(screen.getByRole("button", { name: "Translated next year" })).toBeInTheDocument();
  fireEvent.click(screen.getByText("2025"));
  expect(setTimeframe).toHaveBeenCalledWith({
    ...timeframe,
    type: "year",
    startDate: new Date(2025, 0, 1),
    endDate: new Date(2025, 11, 31),
  });
});

it("falls back to English catalog text and handles an empty quarter", async () => {
  i18n.removeResourceBundle("pt-BR", "translation");
  await i18n.changeLanguage("pt-BR");
  expect(formatTimeframe(timeframe, "en")).toBe("Q1 2026");
  expect(formatTimeframe({ ...timeframe, startDate: null }, "en")).toBeNull();
  render(<TimeframeSelectorDialog open onOpenChange={jest.fn()} timeframe={timeframe} setTimeframe={jest.fn()} />);
  expect(screen.getByText("Select Timeframe")).toBeInTheDocument();
});
