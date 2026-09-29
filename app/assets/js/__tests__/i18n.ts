import i18n, { applyLanguage } from "@/i18n";
import { act } from "react";

// Restore complete bundles so substituted translations never leak between tests.
export function setupTestCatalog() {
  const english = { ...i18n.getResourceBundle("en", "translation") };
  const portuguese = { ...i18n.getResourceBundle("pt-BR", "translation") };

  afterEach(async () => {
    for (const [language, resources] of [
      ["en", english],
      ["pt-BR", portuguese],
    ] as const) {
      i18n.removeResourceBundle(language, "translation");
      i18n.addResourceBundle(language, "translation", resources);
    }
    await act(async () => {
      await applyLanguage("en");
    });
  });
}

export { i18n, applyLanguage };
