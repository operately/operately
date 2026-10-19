import i18n from "@/i18n";
import { getTimezones } from "./timezones";

afterEach(async () => {
  await i18n.changeLanguage("en");
});

it("translates labels at call time without changing timezone IDs or ordering", async () => {
  await i18n.changeLanguage("en");
  const english = getTimezones();
  await i18n.changeLanguage("pt-BR");
  const portuguese = getTimezones();
  expect(portuguese.map(({ value }) => value)).toEqual(english.map(({ value }) => value));
  expect(portuguese.find(({ value }) => value === "America/Los_Angeles")?.label).toBe(
    "(UTC-08:00) Horário do Pacífico (EUA e Canadá)",
  );
  await i18n.changeLanguage("en");
  expect(getTimezones()).toEqual(english);
});
