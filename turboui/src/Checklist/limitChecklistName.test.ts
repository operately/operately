import { CHECKLIST_NAME_MAX_LENGTH, limitChecklistName } from "./limitChecklistName";

describe("limitChecklistName", () => {
  it("keeps a name at the grapheme limit", () => {
    const name = "😀".repeat(CHECKLIST_NAME_MAX_LENGTH);

    expect(limitChecklistName(name)).toBe(name);
  });

  it("drops characters past the grapheme limit without splitting emoji", () => {
    const name = "😀".repeat(CHECKLIST_NAME_MAX_LENGTH);

    expect(limitChecklistName(`${name}x`)).toBe(name);
    expect(limitChecklistName("😀".repeat(CHECKLIST_NAME_MAX_LENGTH + 1))).toBe(name);
  });

  it("counts a combining mark with its base character", () => {
    const grapheme = "e\u0301";
    const name = grapheme.repeat(CHECKLIST_NAME_MAX_LENGTH);

    expect(limitChecklistName(`${name}x`)).toBe(name);
  });
});
