import * as Quarters from "./quarters";

describe("Quarters.fromString", () => {
  it("parses a string into a quarter", () => {
    expect(Quarters.fromString("Q1 2021")).toEqual({ index: 0, year: 2021 });
  });
});

describe("Quarters.toString", () => {
  it("converts a quarter into a string", () => {
    expect(Quarters.toString({ index: 0, year: 2021 })).toEqual("Q1 2021");
  });
});

describe("Quarters.next", () => {
  it("returns the next quarter", () => {
    expect(Quarters.next({ index: 0, year: 2021 })).toEqual({ index: 1, year: 2021 });
    expect(Quarters.next({ index: 1, year: 2021 })).toEqual({ index: 2, year: 2021 });
    expect(Quarters.next({ index: 2, year: 2021 })).toEqual({ index: 3, year: 2021 });
    expect(Quarters.next({ index: 3, year: 2021 })).toEqual({ index: 0, year: 2022 });
  });
});

describe("Quarters.next", () => {
  it("returns the next quarter", () => {
    expect(Quarters.prev({ index: 0, year: 2021 })).toEqual({ index: 3, year: 2020 });
    expect(Quarters.prev({ index: 1, year: 2021 })).toEqual({ index: 0, year: 2021 });
    expect(Quarters.prev({ index: 2, year: 2021 })).toEqual({ index: 1, year: 2021 });
    expect(Quarters.prev({ index: 3, year: 2021 })).toEqual({ index: 2, year: 2021 });
  });
});
