import i18n, { tn } from "./i18n";

describe("i18n", () => {
  it("falls back to the English message identifier", () => {
    expect(i18n.t("Not yet translated")).toEqual("Not yet translated");
  });

  it("interpolates named placeholders", () => {
    expect(i18n.t("Hello {{name}}", { name: "Ada" })).toEqual("Hello Ada");
  });

  it("looks up context with the catalog separator", () => {
    i18n.addResourceBundle("en", "translation", { "Close|button": "Close" }, true, true);

    expect(i18n.t("Close", { context: "button" })).toEqual("Close");
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
});
