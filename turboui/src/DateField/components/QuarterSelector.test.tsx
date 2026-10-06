import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { QuarterSelector } from "./QuarterSelector";
import { i18n, setupTestCatalog } from "../../../test/i18n";

setupTestCatalog();

it("localizes quarter options while keeping the callback value canonical", async () => {
  await i18n.changeLanguage("pt-BR");
  const setSelectedDate = jest.fn();
  render(
    <QuarterSelector selectedDate={null} setSelectedDate={setSelectedDate} visibleYears={[2026]} useStartOfPeriod />,
  );
  fireEvent.click(screen.getByRole("button", { name: "T2" }));
  expect(setSelectedDate).toHaveBeenCalledWith({ date: new Date(2026, 3, 1), dateType: "quarter", value: "Q2 2026" });
});
