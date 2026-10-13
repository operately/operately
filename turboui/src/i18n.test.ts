import i18n, { tn } from "./i18n";

afterEach(async () => {
  await i18n.changeLanguage("en");
});

test("uses English count agreement for missing Russian plural messages", async () => {
  await i18n.changeLanguage("ru");
  for (const count of [0, 1, 2, 5, 11, 21, 22, 1.5]) {
    expect(tn("1 missing task", "{{count}} missing tasks", count)).toBe(
      count === 1 ? "1 missing task" : `${count} missing tasks`,
    );
  }
});
