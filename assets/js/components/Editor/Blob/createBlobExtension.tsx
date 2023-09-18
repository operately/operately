import { Node } from "@tiptap/core";
import { EditableImageView } from "./EditableImageView";
import { ReactNodeViewRenderer } from "@tiptap/react";

export const createBlobExtension = (plugins: any[]) => {
  return Node.create({
    name: "blob",
    inline: true,
    group: "inline",
    draggable: true,

    addAttributes: () => ({
      src: {},
      alt: { default: null },
      title: { default: null },
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

    // @ts-ignore
    addCommands() {
      return (attrs) => (state, dispatch) => {
        const { selection } = state;
        const position = selection.$cursor ? selection.$cursor.pos : selection.$to.pos;
        const node = this.type.create(attrs);
        const transaction = state.tr.insert(position, node);
        dispatch(transaction);
      };
    },

    addNodeView: () => {
      return ReactNodeViewRenderer(EditableImageView);
    },

    addProseMirrorPlugins() {
      return plugins;
    },
  });
};
