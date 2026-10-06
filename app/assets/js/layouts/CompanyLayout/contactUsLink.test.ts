import i18n from "@/i18n";
import { contactUsLink } from "./contactUsLink";

afterEach(async () => {
  await i18n.changeLanguage("en");
});

test.each([
  ["en", "org name", "org id"],
  ["pt-BR", "nome da empresa", "id da empresa"],
  ["fr", "org name", "org id"],
])("localizes the support draft in %s and preserves literal company details", async (locale, nameLabel, idLabel) => {
  await i18n.changeLanguage(locale);
  const link = new URL(contactUsLink("R&D <company> + %", "abc-123"));
  expect(link.pathname).toBe("support@operately.com");
  expect(link.searchParams.get("body")).toBe(`\n\n${nameLabel}: R&D <company> + %\n${idLabel}: abc-123\n\n`);
});
