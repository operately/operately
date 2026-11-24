export function parseMermaidBlock(value: string): string | null {
  const normalized = value.replace(/\r\n?/g, "\n");
  const lines = normalized.endsWith("\n") ? normalized.slice(0, -1).split("\n") : normalized.split("\n");

  if (lines.length < 2) return null;

  const firstLine = lines[0];
  const lastLine = lines.at(-1);
  if (firstLine === undefined || lastLine === undefined) return null;

  const opening = firstLine.match(/^ {0,3}(`{3,}|~{3,})[ \t]*mermaid[ \t]*$/i);
  if (!opening) return null;
  const openingFence = opening[1];
  if (!openingFence || !isMatchingClosingFence(lastLine, openingFence)) return null;
  if (lines.slice(1, -1).some((line) => isMatchingClosingFence(line, openingFence))) return null;

  return lines.slice(1, -1).join("\n");
}

function isMatchingClosingFence(line: string, openingFence: string): boolean {
  const closingFence = line.match(/^ {0,3}(`{3,}|~{3,})[ \t]*$/)?.[1];

  return Boolean(closingFence && closingFence[0] === openingFence[0] && closingFence.length >= openingFence.length);
}
