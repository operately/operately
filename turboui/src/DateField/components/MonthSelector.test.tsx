import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MonthSelector } from "./MonthSelector";
import { i18n, setupTestCatalog } from "../../../test/i18n";

setupTestCatalog();

it("localizes month options while keeping the callback value canonical", async () => {
  await i18n.changeLanguage("pt-BR");
  const setSelectedDate = jest.fn();
  render(
    <MonthSelector selectedDate={null} setSelectedDate={setSelectedDate} visibleYears={[2026]} useStartOfPeriod />,
  );
  fireEvent.click(screen.getByRole("button", { name: "fev." }));
  expect(setSelectedDate).toHaveBeenCalledWith({ date: new Date(2026, 1, 1), dateType: "month", value: "Feb 2026" });
});
