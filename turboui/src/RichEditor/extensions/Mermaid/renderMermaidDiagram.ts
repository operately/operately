let mermaidPromise: Promise<typeof import("mermaid").default> | undefined;

export type MermaidColorMode = "dark" | "light";

async function loadMermaid(): Promise<typeof import("mermaid").default> {
  mermaidPromise ??= import("mermaid").then(({ default: mermaid }) => mermaid);

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
