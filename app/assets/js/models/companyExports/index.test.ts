/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import type { CompanyImportRun } from "@/api";
import i18n, { applyLanguage } from "@/i18n";
import { toImportPageRun } from ".";

jest.mock("@/routes/paths", () => ({ Paths: {} }));
jest.mock("./transferQueries", () => ({}));
jest.mock("./transferLifecycle", () => ({}));

const english = { ...i18n.getResourceBundle("en", "translation") };
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
  i18n.removeResourceBundle("en", "translation");
  i18n.addResourceBundle("en", "translation", english);
  await applyLanguage("en");
});

it.each([
  ["en", false],
  ["en", true],
  ["pt-BR", false],
])("uses catalog copy for import version warnings: %s / substituted=%s", async (language, substituted) => {
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
  expect(result.versionWarning).toBe(
    substituted
      ? "Translated warning: 2.0 / 1.0"
      : "This package was exported from Operately 1.0, but this instance is running 2.0. The import failure may be related to version differences.",
  );
  expect(result.manifestSummary).toEqual(run.manifestSummary);
});

it("only shows a version warning for failed imports from a different version", () => {
  expect(toImportPageRun({ ...run, status: "completed" }).showVersionWarning).toBe(false);
  expect(toImportPageRun({ ...run, manifestSummary: { operatelyVersion: "2.0" } }).showVersionWarning).toBe(false);
});
