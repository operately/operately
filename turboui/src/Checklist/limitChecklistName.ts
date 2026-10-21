const CHECKLIST_NAME_MAX_LENGTH = 2000;

function splitGraphemes(text: string): string[] {
  const Segmenter = typeof Intl !== "undefined" ? Intl.Segmenter : undefined;

  if (typeof Segmenter === "function") {
    return Array.from(
      new Segmenter(undefined, { granularity: "grapheme" }).segment(text),
      (segment) => segment.segment,
    );
  }

  return Array.from(text);
}

export function limitChecklistName(value: string, maxLength = CHECKLIST_NAME_MAX_LENGTH): string {
  const graphemes = splitGraphemes(value);

  if (graphemes.length <= maxLength) return value;

  return graphemes.slice(0, maxLength).join("");
}

export { CHECKLIST_NAME_MAX_LENGTH };
