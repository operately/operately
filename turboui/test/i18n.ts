import i18n from "../src/i18n";
import englishCatalog from "../../app/assets/js/generated/locales/en.json";
import portugueseCatalog from "../../app/assets/js/generated/locales/pt-BR.json";

// Match the app initializer: these keys configure Intl interpolation at runtime.
const formatMessages = {
  intlDateTime: "{{val, datetime}}",
  intlRelativeDateTime: "{{val, relativetime}}",
};
const en = { ...englishCatalog, ...formatMessages };
const ptBR = { ...portugueseCatalog, ...formatMessages };

// Use the same generated catalog as the app; restore bundles so substitutions
// never leak into another case (including newly added keys).
export function setupTestCatalog() {
  beforeEach(async () => {
    i18n.addResourceBundle("en", "translation", en, true, true);
    i18n.addResourceBundle("pt-BR", "translation", ptBR, true, true);
    await i18n.changeLanguage("en");
  });

  afterEach(async () => {
    i18n.removeResourceBundle("en", "translation");
    i18n.removeResourceBundle("pt-BR", "translation");
    i18n.addResourceBundle("en", "translation", en, true, true);
    i18n.addResourceBundle("pt-BR", "translation", ptBR, true, true);
    await i18n.changeLanguage("en");
  });
}

export { i18n };
