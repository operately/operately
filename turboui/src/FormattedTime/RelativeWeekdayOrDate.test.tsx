import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import RelativeWeekdayOrDate from "./RelativeWeekdayOrDate";
import { i18n, setupTestCatalog } from "../../test/i18n";

setupTestCatalog();
beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2026, 9, 5, 12));
});
afterEach(() => jest.useRealTimers());

it.each([
  ["en", "en-US", "this Thursday"],
  ["pt-BR", "pt-BR", "quinta-feira desta semana"],
])("renders a complete relative weekday phrase in %s", async (language, locale, expected) => {
  await i18n.changeLanguage(language);
  render(<RelativeWeekdayOrDate time={new Date(2026, 9, 8)} locale={locale} />);
  expect(screen.getByText(expected)).toBeInTheDocument();
});

it("allows the translated sentence to reorder the weekday and falls back to English", async () => {
  i18n.addResourceBundle("en", "translation", { "this {{weekday}}": "{{weekday}}: translated phrase" }, true, true);
  i18n.removeResourceBundle("pt-BR", "translation");
  await i18n.changeLanguage("pt-BR");
  render(<RelativeWeekdayOrDate time={new Date(2026, 9, 8)} locale="en-US" />);
  expect(screen.getByText("Thursday: translated phrase")).toBeInTheDocument();
});
