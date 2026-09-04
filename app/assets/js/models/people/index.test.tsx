import * as People from "./index";

describe("firstName", () => {
  it("returns the first name", () => {
    expect(People.firstName({ fullName: "Alex Rivera" })).toBe("Alex");
  });

  it("returns an empty string when the person is missing", () => {
    expect(People.firstName(null)).toBe("");
    expect(People.firstName(undefined)).toBe("");
  });

  it("returns an empty string when the full name is missing", () => {
    expect(People.firstName({ fullName: "" })).toBe("");
    expect(People.firstName({ fullName: "  " })).toBe("");
  });
});

describe("formattedName", () => {
  it("can return first name", () => {
    expect(People.formattedName({ fullName: "John Doe" }, "first")).toBe("John");
  });

  it("can return short name", () => {
    expect(People.formattedName({ fullName: "John Doe" }, "short")).toBe("John D.");
  });

  it("can return full name", () => {
    expect(People.formattedName({ fullName: "John Doe" }, "full")).toBe("John Doe");
  });
});
