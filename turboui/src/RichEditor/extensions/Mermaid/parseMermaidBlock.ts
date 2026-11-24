export function parseMermaidBlock(value: string): string | null {
  const normalized = value.replace(/\r\n?/g, "\n");
  const lines = normalized.endsWith("\n") ? normalized.slice(0, -1).split("\n") : normalized.split("\n");

  if (lines.length < 2) return null;

  const firstLine = lines[0];
  const lastLine = lines.at(-1);
  if (firstLine === undefined || lastLine === undefined) return null;

  const opening = firstLine.match(/^ {0,3}(`{3,}|~{3,})[ \t]*mermaid[ \t]*$/i);
  const closing = lastLine.match(/^ {0,3}(`{3,}|~{3,})[ \t]*$/);

  if (!opening || !closing) return null;
  const openingFence = opening[1];
  const closingFence = closing[1];
  if (!openingFence || !closingFence) return null;
  if (openingFence[0] !== closingFence[0] || closingFence.length < openingFence.length) return null;

  return lines.slice(1, -1).join("\n");
}
