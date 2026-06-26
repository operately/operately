import { firstName } from "./people";

describe("firstName", () => {
  it("returns a single-part name unchanged", () => {
    expect(firstName("Madonna")).toBe("Madonna");
  });

  it("returns the first token from a two-part name", () => {
    expect(firstName("John Smith")).toBe("John");
  });

  it("returns the first token from a multi-part name", () => {
    expect(firstName("John Michael Smith")).toBe("John");
  });
});
