import { parseMermaidBlock } from "./parseMermaidBlock";

it("extracts Mermaid source from a complete fenced block", () => {
  expect(parseMermaidBlock("```mermaid\nflowchart TD\n  A --> B\n```\n")).toBe("flowchart TD\n  A --> B");
});

it("accepts case-insensitive Mermaid labels and tilde fences", () => {
  expect(parseMermaidBlock("~~~Mermaid\nsequenceDiagram\n~~~")).toBe("sequenceDiagram");
});

it("leaves multiple fenced Mermaid blocks unchanged", () => {
  expect(parseMermaidBlock("```mermaid\nflowchart TD\n```\n```mermaid\nflowchart LR\n```")).toBeNull();
});

it.each([
  "```js\nconst diagram = true\n```",
  "Some context\n```mermaid\nflowchart TD\n```",
  "```mermaid\nflowchart TD",
  "```mermaid\nflowchart TD\n~~~",
])("leaves non-Mermaid or partial Markdown unchanged: %s", (value) => {
  expect(parseMermaidBlock(value)).toBeNull();
});
