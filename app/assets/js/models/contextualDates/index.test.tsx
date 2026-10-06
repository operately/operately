import { ContextualDate } from "@/api";
import { i18n, setupTestCatalog } from "../../../../../turboui/test/i18n";
import { getDateWithoutCurrentYear } from "../../../../../turboui/src/DateField/utils";
import { parseContextualDate, serializeContextualDate } from ".";

setupTestCatalog();

test.each(["en", "pt-BR"])("preserves November after saving and reloading a month in %s", async (language) => {
  await i18n.changeLanguage(language);
  const selected = { date: new Date(2026, 10, 1), dateType: "month" as const, value: "Nov 2026" };
  const saved = serializeContextualDate(selected);
  expect(saved?.date).toBe("2026-11-01");

  const reloaded = parseContextualDate(saved);
  expect(reloaded?.date).toEqual(new Date(2026, 10, 1));
  expect(serializeContextualDate(reloaded)).toEqual(saved);
  if (!reloaded) throw new Error("Expected a contextual date");
  expect(getDateWithoutCurrentYear(reloaded)).toBe(language === "pt-BR" ? "nov. de 2026" : "Nov 2026");
});

test.each([
  ["day", "2026-11-01", "Nov 1, 2026"],
  ["month", "2026-01-01", "Jan 2026"],
  ["quarter", "2026-04-01", "Q2 2026"],
  ["year", "2026-01-01", "2026"],
  ["day", "2024-02-29", "Feb 29, 2024"],
] as const)("round-trips %s calendar dates without shifting the day", (dateType, date, value) => {
  const input: ContextualDate = { __typename: "contextual_date", dateType, date, value };
  expect(serializeContextualDate(parseContextualDate(input))).toEqual(input);
});

test("keeps absent dates absent", () => {
  expect(parseContextualDate(null)).toBeNull();
  expect(parseContextualDate(undefined)).toBeNull();
});
