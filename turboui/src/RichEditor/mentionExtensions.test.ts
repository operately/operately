import { mentionExtensions } from "./mentionExtensions";

const peopleSearch = jest.fn();

describe("mentionExtensions", () => {
  it("omits mentions when editing without peopleSearch", () => {
    expect(mentionExtensions({}, true)).toEqual([]);
  });

  it("includes mentions for read-only display without peopleSearch", () => {
    expect(mentionExtensions({}, false)).toHaveLength(1);
  });

  it("includes mentions for editable editors with peopleSearch", () => {
    expect(mentionExtensions({ peopleSearch }, true)).toHaveLength(1);
  });
});
