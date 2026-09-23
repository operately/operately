import i18n, { applyLanguage, tn } from "./i18n";

describe("i18n", () => {
  it("falls back to the English message identifier", () => {
    expect(i18n.t("Not yet translated")).toEqual("Not yet translated");
  });

  it("interpolates named placeholders", () => {
    expect(i18n.t("Hello {{name}}", { name: "Ada" })).toEqual("Hello Ada");
  });

  it("looks up context with the catalog separator", () => {
    i18n.addResourceBundle("en", "translation", { "Close|button": "Close dialog" }, true, true);

    expect(i18n.t("Close", { context: "button" })).toEqual("Close dialog");
  });

  it("selects language-aware plural forms", () => {
    i18n.addResourceBundle(
      "en",
      "translation",
      {
        "1 task_one": "1 task",
        "1 task_other": "{{count}} tasks",
      },
      true,
      true,
    );

    expect(tn("1 task", "{{count}} tasks", 1)).toEqual("1 task");
    expect(tn("1 task", "{{count}} tasks", 3)).toEqual("3 tasks");
  });

  it("keeps rich-text tags in the translated string", () => {
    const key = "Click <link>here</link> to continue";
    i18n.addResourceBundle("en", "translation", { [key]: key }, true, true);

    expect(i18n.t(key)).toEqual(key);
  });

  describe("Brazilian Portuguese", () => {
    afterEach(async () => {
      await applyLanguage("en");
    });

    it("renders reviewed Portuguese copy for the pilot workflow", async () => {
      await applyLanguage("pt-BR");

      expect(i18n.language).toBe("pt-BR");
      expect(i18n.t("Home")).toBe("Início");
      expect(i18n.t("New task")).toBe("Nova tarefa");
      expect(i18n.t('New task "{{taskName}}" was created', { taskName: "Call leads" })).toBe(
        'Nova tarefa "Call leads" foi criada',
      );
      expect(i18n.t("Close")).toBe("Fechar");
    });

    it("falls back to English for missing translations including plurals", async () => {
      await applyLanguage("pt-BR");

      expect(i18n.t("Not yet translated")).toBe("Not yet translated");
      expect(tn("1 missing plural", "{{count}} missing plurals", 3)).toBe("3 missing plurals");
    });

    it("ignores unsupported languages and keeps English", async () => {
      await applyLanguage("fr");

      expect(i18n.language).toBe("en");
      expect(i18n.t("Home")).toBe("Home");
    });

    it("does not select a language from the browser", () => {
      expect(i18n.options.lng).toBe("en");
      expect(i18n.services.languageDetector).toBeUndefined();
      expect(i18n.language).toBe("en");
    });
  });
});

describe.each([true, false])("initialization with TurboUI first: %s", (turboFirst) => {
  afterEach(() => {
    jest.dontMock("../../../turboui/node_modules/i18next");
  });

  it("uses catalog context keys in either import order", () => {
    jest.isolateModules(() => {
      // Match Vite's deduplication of the shared runtime across both packages.
      const runtime = jest.requireActual<typeof i18n>("i18next");
      jest.doMock("../../../turboui/node_modules/i18next", () => runtime);

      if (turboFirst) jest.requireActual("turboui/i18n");
      const app = jest.requireActual<typeof import("./i18n")>("./i18n");
      const turbo = jest.requireActual<typeof import("turboui/i18n")>("turboui/i18n");

      expect(app.default).toBe(turbo.default);
      runtime.addResourceBundle("en", "translation", { "Close|button": "Close dialog" }, true, true);
      expect(runtime.t("Close", { context: "button" })).toBe("Close dialog");
      expect(runtime.language).toBe("en");
      expect(runtime.t("intlDateTime", { val: new Date("2026-01-01T12:00:00Z") })).not.toBe("intlDateTime");
    });
  });
});
