import { parseContent, richContentToString } from "../RichContent";

export function plainDescription(description?: string | null) {
  if (!description) return "";
  try {
    return richContentToString(parseContent(description)).trim();
  } catch (_error) {
    return "";
  }
}
