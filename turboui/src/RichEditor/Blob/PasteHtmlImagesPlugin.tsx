import { Plugin, PluginKey } from "prosemirror-state";

/**
 * This plugin removes images from HTML content when pasting from websites,
 * while preserving all other formatting like bold text, headings, etc.
 *
 * It focuses only on the HTML transformation step to avoid TypeScript compatibility
 * issues between different ProseMirror versions.
 */
export const PasteHtmlImagesPlugin = new Plugin({
  key: new PluginKey("pasteHtmlImagesPlugin"),

  props: {
    // This hook runs when parsing HTML during paste operations
    transformPastedHTML(html) {
      // Case insensitive check for image tags (handles <img>, <IMG>, etc.)
      if (!/\<img|\<IMG/i.test(html)) return html;

      // Create a DOMParser to safely parse HTML without executing scripts
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      // Find all img elements and remove them
      const images = doc.querySelectorAll("img");
      if (images.length === 0) return html;

      images.forEach((img) => img.remove());

      // Find and remove empty paragraphs (that might have contained only images)
      const paragraphs = doc.querySelectorAll("p");
      paragraphs.forEach((p) => {
        if (p.innerHTML.trim() === "") {
          p.remove();
        }
      });

      return doc.body.innerHTML;
    },
  },
});
