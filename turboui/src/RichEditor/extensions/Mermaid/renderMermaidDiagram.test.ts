import { renderMermaidDiagram, type MermaidColorMode } from "./renderMermaidDiagram";

const mockInitialize = jest.fn();
const mockRender = jest.fn();

jest.mock("mermaid", () => ({
  __esModule: true,
  default: {
    initialize: mockInitialize,
    render: mockRender,
  },
}));

beforeEach(() => {
  mockInitialize.mockReset();
  mockRender.mockReset().mockResolvedValue({ svg: "<svg></svg>" });
});

it.each([
  ["light", "default"],
  ["dark", "dark"],
] as const)("uses Mermaid's %s-mode theme", async (colorMode: MermaidColorMode, theme) => {
  await expect(renderMermaidDiagram("flowchart TD", "diagram-id", colorMode)).resolves.toBe("<svg></svg>");

  expect(mockInitialize).toHaveBeenLastCalledWith({
    startOnLoad: false,
    securityLevel: "strict",
    suppressErrorRendering: true,
    theme,
  });
  expect(mockRender).toHaveBeenLastCalledWith("diagram-id", "flowchart TD");
});
