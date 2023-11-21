import { createPath } from "./paths";

describe("cretePath", () => {
  it("if no parts are given, returns /", () => {
    expect(createPath()).toEqual("/");
  });

  it("if multiple parts are given, joins them with /", () => {
    expect(createPath("projects", "new")).toEqual("/projects/new");
  });

  it("if a part contains a slash, throws an error", () => {
    expect(() => createPath("projects", "new/")).toThrow();
  });

  it("if a part is not a string, throws an error", () => {
    expect(() => createPath("projects", 123)).toThrow();
  });

  it("if the last part is an object, creates a query string", () => {
    expect(createPath("projects", { foo: "bar" })).toEqual("/projects?foo=bar");
  });
});
