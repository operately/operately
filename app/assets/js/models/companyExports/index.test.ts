/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import type { CompanyImportRun } from "@/api";
import i18n, { applyLanguage } from "@/i18n";
import { toImportPageRun } from ".";

jest.mock("@/routes/paths", () => ({ Paths: {} }));
jest.mock("./transferQueries", () => ({}));
jest.mock("./transferLifecycle", () => ({}));

const english = { ...i18n.getResourceBundle("en", "translation") };
const portuguese = { ...i18n.getResourceBundle("pt-BR", "translation") };
const originalConfig = window.appConfig;
const message =
  "This package was exported from Operately {{manifestVersion}}, but this instance is running {{currentVersion}}. The import failure may be related to version differences.";
const run: CompanyImportRun = {
  __typename: "company_import_run",
  id: "import-1",
  status: "failed",
  manifestSummary: { operatelyVersion: "1.0" },
  insertedAt: "2026-09-25T12:00:00Z",
};

beforeEach(() => {
  window.appConfig = { ...originalConfig, version: "2.0" };
});

afterEach(async () => {
  window.appConfig = originalConfig;
  for (const [language, resources] of [
    ["en", english],
    ["pt-BR", portuguese],
  ] as const) {
    i18n.removeResourceBundle(language, "translation");
    i18n.addResourceBundle(language, "translation", resources);
  }
  await applyLanguage("en");
});

const englishWarning =
  "This package was exported from Operately 1.0, but this instance is running 2.0. The import failure may be related to version differences.";
const portugueseWarning =
  "Este pacote foi exportado do Operately 1.0, mas esta instância está na versão 2.0. A falha na importação pode estar relacionada às diferenças de versão.";

it.each([
  ["en", false, englishWarning],
  ["en", true, "Translated warning: 2.0 / 1.0"],
  ["pt-BR", false, portugueseWarning],
])("uses catalog copy for import version warnings: %s / substituted=%s", async (language, substituted, warning) => {
  if (substituted) {
    i18n.addResourceBundle(
      "en",
      "translation",
      { [message]: "Translated warning: {{currentVersion}} / {{manifestVersion}}" },
      true,
      true,
    );
  }
  await applyLanguage(language);
  const result = toImportPageRun(run);
  expect(result.showVersionWarning).toBe(true);
  expect(result.versionWarning).toBe(warning);
  expect(result.manifestSummary).toEqual(run.manifestSummary);
});

it("falls back to English when the Portuguese import version warning is missing", async () => {
  i18n.removeResourceBundle("pt-BR", "translation");
  await applyLanguage("pt-BR");
  expect(toImportPageRun(run).versionWarning).toBe(englishWarning);
});

it("only shows a version warning for failed imports from a different version", () => {
  expect(toImportPageRun({ ...run, status: "completed" }).showVersionWarning).toBe(false);
  expect(toImportPageRun({ ...run, manifestSummary: { operatelyVersion: "2.0" } }).showVersionWarning).toBe(false);
});
