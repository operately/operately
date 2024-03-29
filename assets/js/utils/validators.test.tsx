import { Validators } from "./validators";

describe("Validators.nonEmptyNumber", () => {
  it("returns true for a number", () => {
    expect(Validators.nonEmptyNumber(1)).toBe(true);
    expect(Validators.nonEmptyNumber(-1)).toBe(true);
    expect(Validators.nonEmptyNumber(-1000)).toBe(true);
    expect(Validators.nonEmptyNumber(1000)).toBe(true);
  });

  it("returns false for null", () => {
    expect(Validators.nonEmptyNumber(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(Validators.nonEmptyNumber(undefined)).toBe(false);
  });
});
