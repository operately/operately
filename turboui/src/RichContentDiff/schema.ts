import { getSchema } from "@tiptap/core";

import { createRichEditorExtensions } from "../RichEditor/createRichEditorExtensions";

/** Shared schema for fixture tests and schema-only callers (no React editor). */
export function createRichContentSchema() {
  const extensions = createRichEditorExtensions({}, { editable: false });
  return getSchema(extensions);
}
