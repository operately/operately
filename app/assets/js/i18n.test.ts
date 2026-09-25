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

    it("renders Portuguese account, navigation, and administration copy", async () => {
      await applyLanguage("pt-BR");

      expect(i18n.t("My Account")).toBe("Minha conta");
      expect(i18n.t("Company Administration")).toBe("Administração da empresa");
      expect(i18n.t("Documents & Files")).toBe("Docs & Arquivos");
      expect(i18n.t("Help")).toBe("Ajuda");
      expect(i18n.t("Sign In")).toBe("Entrar");
      expect(tn("1 member", "{{count}} members", 0)).toBe("0 membros");
      expect(tn("1 member", "{{count}} members", 1)).toBe("1 membro");
      expect(tn("1 member", "{{count}} members", 3)).toBe("3 membros");
      expect(tn("1 member", "{{count}} members", 1_000_000)).toBe("1000000 membros");
      expect(tn("1 result", "{{count}} results", 2)).toBe("2 resultados");
      expect(
        tn("You can request another code in 1 second.", "You can request another code in {{count}} seconds.", 1),
      ).toBe("Você pode solicitar outro código em 1 segundo.");
      expect(
        tn("You can request another code in 1 second.", "You can request another code in {{count}} seconds.", 5),
      ).toBe("Você pode solicitar outro código em 5 segundos.");
      expect(
        i18n.t("Verify this inbox first. Then we’ll send a separate code to <email>{{email}}</email>.", {
          email: "ana@example.com",
        }),
      ).toBe(
        "Verifique esta caixa de entrada primeiro. Depois, enviaremos outro código para <email>ana@example.com</email>.",
      );
    });

    it("renders Portuguese leftover account and onboarding copy", async () => {
      await applyLanguage("pt-BR");

      expect(i18n.t("What's your role?")).toBe("Qual é seu cargo?");
      expect(i18n.t("Add your profile picture")).toBe("Adicione sua foto de perfil");
      expect(i18n.t("Thanks for signing up!")).toBe("Obrigado por se cadastrar!");
      expect(i18n.t("Co-founder & CEO of Operately")).toBe("Cofundador e CEO do Operately");
      expect(i18n.t("Let teammates know what you focus on. You can change this later.")).toBe(
        "Mostre aos colegas qual o seu foco. Você pode alterar isso depois.",
      );
      expect(
        i18n.t("* If you sign in with Google, you must use <email>{{email}}</email>.", { email: "ana@example.com" }),
      ).toBe("* Se você entrar com o Google, use o e-mail <email>ana@example.com</email>.");
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
