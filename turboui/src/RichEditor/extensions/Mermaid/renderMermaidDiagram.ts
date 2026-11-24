type Mermaid = typeof import("mermaid").default;

let mermaidPromise: Promise<Mermaid> | undefined;

export type MermaidColorMode = "dark" | "light";

async function loadMermaid(): Promise<Mermaid> {
  mermaidPromise ??= import("mermaid/dist/mermaid.esm.min.mjs").then(({ default: mermaid }) => mermaid);

  return mermaidPromise;
}

export async function renderMermaidDiagram(source: string, id: string, colorMode: MermaidColorMode): Promise<string> {
  const mermaid = await loadMermaid();
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "strict",
    suppressErrorRendering: true,
    theme: colorMode === "dark" ? "dark" : "default",
  });

  const { svg } = await mermaid.render(id, source);
  return svg;
}
