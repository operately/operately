import i18n, { applyLanguage } from "@/i18n";
import { act } from "react";

// Restore complete bundles so substituted translations never leak between tests.
export function setupTestCatalog() {
  const spanish = { ...i18n.getResourceBundle("es", "translation") };
  const french = { ...i18n.getResourceBundle("fr", "translation") };
  const german = { ...i18n.getResourceBundle("de", "translation") };
  const russian = { ...i18n.getResourceBundle("ru", "translation") };
  const english = { ...i18n.getResourceBundle("en", "translation") };
  const portuguese = { ...i18n.getResourceBundle("pt-BR", "translation") };

  afterEach(async () => {
    for (const [language, resources] of [
      ["en", english],
      ["fr", french],
      ["es", spanish],
      ["de", german],
      ["ru", russian],
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
