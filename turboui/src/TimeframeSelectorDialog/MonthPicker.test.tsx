import "@testing-library/jest-dom";
import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { i18n, setupTestCatalog } from "../../test/i18n";
import { MonthPicker } from "./MonthPicker";

setupTestCatalog();

test("month names and navigation are localized without changing the selected period", async () => {
  await i18n.changeLanguage("pt-BR");
  const setTimeframe = jest.fn();
  render(
    <MonthPicker
      timeframe={{ type: "month", startDate: new Date(2026, 0, 1), endDate: new Date(2026, 0, 31) }}
      setTimeframe={setTimeframe}
    />,
  );
  fireEvent.click(screen.getByRole("option", { name: "Escolher fevereiro 2026" }));
  expect(setTimeframe).toHaveBeenCalledWith({
    type: "month",
    startDate: new Date(2026, 1, 1),
    endDate: new Date(2026, 1, 28),
  });
  fireEvent.click(screen.getByRole("button", { name: "Próximo ano" }));
  expect(screen.getByRole("option", { name: "Escolher janeiro 2027" })).toBeInTheDocument();
});

test("updates accessible month names when the app language changes and falls back to English", async () => {
  render(
    <MonthPicker
      timeframe={{ type: "month", startDate: new Date(2026, 10, 1), endDate: new Date(2026, 10, 30) }}
      setTimeframe={jest.fn()}
    />,
  );
  expect(screen.getByRole("option", { name: "Choose November 2026" })).toHaveAttribute("aria-selected", "true");

  await act(async () => {
    await i18n.changeLanguage("pt-BR");
  });
  expect(screen.getByRole("option", { name: "Escolher novembro 2026" })).toHaveAttribute("aria-selected", "true");

  await act(async () => {
    await i18n.changeLanguage("en");
  });
  expect(screen.getByRole("option", { name: "Choose November 2026" })).toBeInTheDocument();

  await act(async () => {
    await i18n.changeLanguage("fr");
  });
  expect(screen.getByRole("option", { name: "Choose November 2026" })).toBeInTheDocument();
});
