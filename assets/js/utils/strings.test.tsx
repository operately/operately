import * as Strings from "./strings";


describe("Strings.camelCaseToSnakeCase", () => {
  it("parses a camel case string to snake case", () => {
    const input = "thisIsACamelCaseString";
    const result = "this_is_a_camel_case_string";
    
    expect(Strings.camelCaseToSnakeCase(input)).toEqual(result);
  });
});

describe("Strings.snakeCaseToSpacedWords", () => {
  it("parses a snake case string to words separated by space", () => {
    const input = "this_is_a_snake_case_string";
    const result = "this is a snake case string";

    expect(Strings.snakeCaseToSpacedWords(input)).toEqual(result);
  });
  
  it("parses a snake case string to words separated by space and capitalizes first word", () => {
    const input = "this_is_a_snake_case_string";
    const result = "This is a snake case string";

    expect(Strings.snakeCaseToSpacedWords(input, { capitalizeFirst: true })).toEqual(result);
  });
});

describe("Strings.camelCaseToSpacedWords", () => {
  it("parses a camel case string to words separated by space", () => {
    const input = "thisIsACamelCaseString";
    const result = "this is a camel case string";
    
    expect(Strings.camelCaseToSpacedWords(input)).toEqual(result);
  });
  
  it("parses a camel case string to words separated by space and capitalizes first word", () => {
    const input = "thisIsACamelCaseString";
    const result = "This is a camel case string";
    
    expect(Strings.camelCaseToSpacedWords(input, { capitalizeFirst: true })).toEqual(result);
  });
});

describe("Strings.truncateString", () => {
  it("Truncates string with default suffix", () => {
    const input = "This is an unnecessarily long string.";
    const result = "This is an...";
    
    expect(Strings.truncateString(input, 10)).toEqual(result);
  });
  
  it("Truncates string with custom suffix", () => {
    const input = "This is an unnecessarily long string.";
    const result = "This is an___";
    
    expect(Strings.truncateString(input, 10, "___")).toEqual(result);
  });
  
  it("Truncates string without suffix", () => {
    const input = "This is an unnecessarily long string.";
    const result = "This is an";
    
    expect(Strings.truncateString(input, 10, "")).toEqual(result);
  });
  
  it("Truncates string and removes white space", () => {
    const input = "This is a string.";
    const result = "This is a...";
    
    expect(Strings.truncateString(input, 10)).toEqual(result);
    
    expect(Strings.truncateString(input, 10, "").length).toEqual(9);
  });
});