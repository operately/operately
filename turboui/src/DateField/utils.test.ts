import { getDateWithoutCurrentYear } from "./utils";
import { i18n, setupTestCatalog } from "../../test/i18n";

setupTestCatalog();
beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2026, 6, 1));
});
afterEach(() => jest.useRealTimers());

it.each([
  ["day", "Jul 15, 2026", "15 de jul."],
  ["month", "Jul 2026", "jul. de 2026"],
  ["quarter", "Q3 2026", "T3 2026"],
] as const)("translates %s presentation without mutating its canonical value", async (dateType, value, expected) => {
  await i18n.changeLanguage("pt-BR");
  const date = { date: new Date(2026, 6, 15), dateType, value };
  expect(getDateWithoutCurrentYear(date)).toBe(expected);
  expect(date.value).toBe(value);
});
