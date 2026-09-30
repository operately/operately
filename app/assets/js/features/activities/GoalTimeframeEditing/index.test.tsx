import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import i18n, { applyLanguage } from "@/i18n";
import { resolveEffectiveLanguage } from "@/i18n/languages";
import type { Activity } from "@/models/activities";
import Handler from ".";

jest.mock("turboui", () => ({}));
jest.mock("@/hooks/useRichEditorHandlers", () => ({ useRichEditorHandlers: () => ({}) }));

const portuguese = { ...i18n.getResourceBundle("pt-BR", "translation") };

function title(change: number) {
  const timeframe = (end: number) => ({
    contextualStartDate: { date: "2026-09-01" },
    contextualEndDate: { date: `2026-09-${String(end).padStart(2, "0")}` },
  });
  const activity = { content: { oldTimeframe: timeframe(10), newTimeframe: timeframe(10 + change) } } as Activity;
  return renderToStaticMarkup(<Handler.PageTitle activity={activity} />);
}

afterEach(async () => {
  i18n.removeResourceBundle("pt-BR", "translation");
  i18n.addResourceBundle("pt-BR", "translation", portuguese);
  await applyLanguage("en");
});

it.each([0, 1, 3, -1, -3])("preserves existing English detail-page count wording (%i days)", async (change) => {
  await applyLanguage(resolveEffectiveLanguage("pt-BR", false));
  expect(title(change)).toBe(`Timeframe ${change > 0 ? "extended" : "shortened"} by ${Math.abs(change)} days`);
});

it.each([0, 1, 3, -1, -3])("falls back with missing Portuguese count translations (%i days)", async (change) => {
  i18n.removeResourceBundle("pt-BR", "translation");
  await applyLanguage("pt-BR");
  expect(title(change)).toBe(`Timeframe ${change > 0 ? "extended" : "shortened"} by ${Math.abs(change)} days`);
});

it("looks up plural detail-page sentences", async () => {
  i18n.addResourceBundle(
    "pt-BR",
    "translation",
    {
      "Timeframe shortened by {{count}} days_zero": "UNCHANGED {{count}}",
      "Timeframe extended by {{count}} days_one": "ONE {{count}}",
      "Timeframe extended by {{count}} days_other": "MANY {{count}}",
    },
    true,
    true,
  );
  await applyLanguage("pt-BR");
  expect(title(0)).toBe("UNCHANGED 0");
  expect(title(1)).toBe("ONE 1");
  expect(title(3)).toBe("MANY 3");
});
