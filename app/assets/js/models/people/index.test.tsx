import * as People from "./index";

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
