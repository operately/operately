import { filterDescription } from "./filterDescription";
import { i18n, setupTestCatalog } from "../../../test/i18n";

setupTestCatalog();

it("translates complete conditions without translating custom status names", async () => {
  i18n.addResource("pt-BR", "translation", "Status is not {{status}}", "Exceto o status {{status}}");
  await i18n.changeLanguage("pt-BR");
  expect(filterDescription({ type: "status", operator: "is_not", value: { label: "Review <QA>" } })).toBe(
    "Exceto o status Review <QA>",
  );
});

it("falls back to the complete English condition when Portuguese is missing", async () => {
  i18n.removeResourceBundle("pt-BR", "translation");
  await i18n.changeLanguage("pt-BR");
  expect(filterDescription({ type: "assignee", operator: "is_not", value: { fullName: "Ada & Grace" } })).toBe(
    "Assignee is not Ada & Grace",
  );
});
