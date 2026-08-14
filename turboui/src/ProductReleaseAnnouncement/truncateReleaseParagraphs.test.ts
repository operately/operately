import { truncateReleaseParagraphs } from "./truncateReleaseParagraphs";

describe("truncateReleaseParagraphs", () => {
  it("returns nothing when there are no paragraphs", () => {
    expect(truncateReleaseParagraphs([])).toEqual({ shown: [], truncated: false });
  });

  it("shows one paragraph when the first is a normal length", () => {
    const first = "a".repeat(280);
    const second = "Short follow-up.";

    expect(truncateReleaseParagraphs([first, second])).toEqual({ shown: [first], truncated: true });
  });

  it("shows two paragraphs when both are short", () => {
    const first = "Operately v1.8 is here.";
    const second = "Connect an AI client, schedule posts, and acknowledge retrospectives.";
    const third = "There is more in the full post.";

    expect(truncateReleaseParagraphs([first, second, third])).toEqual({
      shown: [first, second],
      truncated: true,
    });
  });

  it("shows only the first short paragraph when the second is long", () => {
    const first = "Operately v1.8 is here.";
    const second = "a".repeat(280);

    expect(truncateReleaseParagraphs([first, second])).toEqual({ shown: [first], truncated: true });
  });

  it("does not mark a single short paragraph as truncated", () => {
    const first = "Operately v1.8 is here.";

    expect(truncateReleaseParagraphs([first])).toEqual({ shown: [first], truncated: false });
  });
});
