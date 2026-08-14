const SHORT_PARAGRAPH_MAX_CHARS = 280;

export function truncateReleaseParagraphs(paragraphs: string[]): { shown: string[]; truncated: boolean } {
  if (paragraphs.length === 0) {
    return { shown: [], truncated: false };
  }

  const first = paragraphs[0]!;

  if (first.length >= SHORT_PARAGRAPH_MAX_CHARS) {
    return { shown: [first], truncated: paragraphs.length > 1 };
  }

  const second = paragraphs[1];
  if (second && second.length < SHORT_PARAGRAPH_MAX_CHARS) {
    return { shown: [first, second], truncated: paragraphs.length > 2 };
  }

  return { shown: [first], truncated: paragraphs.length > 1 };
}
