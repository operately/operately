import mermaidBundleUrl from "mermaid/dist/mermaid.min.js?url";

type Mermaid = typeof import("mermaid").default;
type MermaidGlobal = typeof globalThis & { mermaid?: Mermaid };

let mermaidPromise: Promise<Mermaid> | undefined;

export type MermaidColorMode = "dark" | "light";

async function loadMermaid(): Promise<Mermaid> {
  const loadedMermaid = (globalThis as MermaidGlobal).mermaid;
  if (loadedMermaid) return loadedMermaid;

  mermaidPromise ??= loadMermaidBrowserBundle().finally(() => {
    mermaidPromise = undefined;
  });

  return mermaidPromise;
}

function loadMermaidBrowserBundle(): Promise<Mermaid> {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = mermaidBundleUrl;
    script.async = true;

    script.addEventListener("load", () => {
      const mermaid = (globalThis as MermaidGlobal).mermaid;
      if (mermaid) {
        resolve(mermaid);
      } else {
        script.remove();
        reject(new Error("Mermaid browser bundle did not initialize."));
      }
    });

    script.addEventListener("error", () => {
      script.remove();
      reject(new Error("Mermaid browser bundle could not be loaded."));
    });

    document.head.append(script);
  });
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
