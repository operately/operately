import MentionPeople from ".";

describe("MentionPeople", () => {
  it("uses fixed positioning for suggestion popups", () => {
    const extension = MentionPeople.configure();

    expect(extension.options.suggestion.floatingUi).toEqual({ strategy: "fixed" });
  });
});
