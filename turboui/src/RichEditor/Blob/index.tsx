import { Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";

import { BlobView } from "./BlobView";
import { DropFilePlugin } from "./DropFilePlugin";
import { PasteFilePlugin } from "./PasteFilePlugin";

export function isUploadInProgress(doc: any) {
  let result = false;

  doc.descendants((node: any) => {
    if (node.type.name === "blob" && node.attrs.status === "uploading") {
      result = true;
      return false; // stop searching, we found what we're looking for
    }

    return true;
  });

  return result;
}

const BlobExtension = Node.create({
  name: "blob",
  inline: true,
  group: "inline",
  draggable: true,

  addAttributes: () => ({
    src: {},
    alt: { default: null },
    title: { default: null },
    id: { default: null },
    status: { default: "uploading" },
    filetype: { default: null },
    filesize: { default: null },
    progress: { default: 0 },
  }),

  parseHTML: () => [
    {
      tag: "img[src]",
      getAttrs: (dom) => {
        if (typeof dom === "string") return {};
        const element = dom as HTMLImageElement;

        return {
          src: element.getAttribute("src"),
          title: element.getAttribute("title"),
          alt: element.getAttribute("alt"),
        };
      },
    },
  ],

  renderHTML: ({ HTMLAttributes }) => {
    return [
      "div",
      { class: "blob-container" },
      ["img", HTMLAttributes],
      ["div", { class: "footer" }, ["span", { class: "title" }, HTMLAttributes.alt]],
    ];
  },

  addNodeView: () => {
    return ReactNodeViewRenderer(BlobView);
  },

  addProseMirrorPlugins() {
    return [PasteFilePlugin, DropFilePlugin];
  },
});

export default BlobExtension;
