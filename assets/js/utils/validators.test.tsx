import { isValidURL, Validators } from "./validators";

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

describe("isValidURL", () => {
  test("returns true for a valid HTTP URL", () => {
    expect(isValidURL("http://example.com")).toBe(true);
  });

  test("returns true for a valid HTTPS URL", () => {
    expect(isValidURL("https://example.com")).toBe(true);
  });

  test("returns false for an invalid URL", () => {
    expect(isValidURL("not-a-url")).toBe(false);
  });

  test("returns false for a URL with unsupported protocol", () => {
    expect(isValidURL("ftp://example.com")).toBe(false);
  });

  test("returns true for a valid URL with query parameters", () => {
    expect(isValidURL("https://example.com?query=test")).toBe(true);
  });

  test("returns true for a valid URL with a fragment", () => {
    expect(isValidURL("https://example.com#section")).toBe(true);
  });

  test("returns false for a missing protocol", () => {
    expect(isValidURL("example.com")).toBe(false);
  });

  test("returns false for an empty string", () => {
    expect(isValidURL("")).toBe(false);
  });
});
