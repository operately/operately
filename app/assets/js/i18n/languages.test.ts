import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, isSupportedLanguage, resolveEffectiveLanguage } from "./languages";

describe("resolveEffectiveLanguage", () => {
  it.each(SUPPORTED_LANGUAGES)("uses the saved %s preference", (language) => {
    expect(resolveEffectiveLanguage(language)).toBe(language);
  });

  it.each([null, undefined, "nl"])("uses English for missing or unsupported preference %s", (preference) => {
    expect(resolveEffectiveLanguage(preference)).toBe(DEFAULT_LANGUAGE);
  });

  it("rejects unsupported language variants", () => {
    expect(isSupportedLanguage("pt")).toBe(false);
  });
});
