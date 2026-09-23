import { DEFAULT_LANGUAGE, isSupportedLanguage, resolveEffectiveLanguage } from "./languages";

describe("resolveEffectiveLanguage", () => {
  it("uses English when the i18n flag is off even if pt-BR is saved", () => {
    expect(resolveEffectiveLanguage("pt-BR", false)).toBe(DEFAULT_LANGUAGE);
  });

  it("uses an explicit supported language when the flag is on", () => {
    expect(resolveEffectiveLanguage("pt-BR", true)).toBe("pt-BR");
    expect(resolveEffectiveLanguage("en", true)).toBe("en");
  });

  it("uses English for missing or unsupported preferences", () => {
    expect(resolveEffectiveLanguage(null, true)).toBe("en");
    expect(resolveEffectiveLanguage(undefined, true)).toBe("en");
    expect(resolveEffectiveLanguage("fr", true)).toBe("en");
    expect(isSupportedLanguage("pt")).toBe(false);
  });
});
