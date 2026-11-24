import { renderMermaidDiagram, type MermaidColorMode } from "./renderMermaidDiagram";

const mockInitialize = jest.fn();
const mockRender = jest.fn();
const mermaidBundleUrl = "/assets/mermaid.min.js";
type Mermaid = typeof import("mermaid").default;
type MermaidGlobal = typeof globalThis & { mermaid?: Mermaid };

jest.mock("mermaid/dist/mermaid.min.js?url", () => ({ __esModule: true, default: "/assets/mermaid.min.js" }), {
  virtual: true,
});

beforeEach(() => {
  mockInitialize.mockReset();
  mockRender.mockReset().mockResolvedValue({ svg: "<svg></svg>" });
  setMockMermaidGlobal();
});

afterEach(() => {
  delete (globalThis as MermaidGlobal).mermaid;
  document.querySelectorAll(`script[src="${mermaidBundleUrl}"]`).forEach((script) => script.remove());
});

it("loads Mermaid's browser bundle as an opaque script asset", async () => {
  delete (globalThis as MermaidGlobal).mermaid;

  const rendering = renderMermaidDiagram("flowchart TD", "diagram-id", "light");
  const script = document.querySelector<HTMLScriptElement>(`script[src="${mermaidBundleUrl}"]`);

  expect(script).not.toBeNull();
  setMockMermaidGlobal();
  script?.dispatchEvent(new Event("load"));

  await expect(rendering).resolves.toBe("<svg></svg>");
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

function setMockMermaidGlobal(): void {
  (globalThis as MermaidGlobal).mermaid = {
    initialize: mockInitialize,
    render: mockRender,
  } as unknown as Mermaid;
}
