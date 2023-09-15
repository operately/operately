import React from "react";
import axios from "axios";

import { Node } from "@tiptap/core";
import { NodeViewWrapper, NodeViewContent, ReactNodeViewRenderer } from "@tiptap/react";

import { Plugin } from "prosemirror-state";
import * as Icons from "@tabler/icons-react";

export type UploadFn = (image: File) => Promise<{ data: { path: string } }>;

function csrftoken(): string | null {
  let element = document.querySelector("meta[name='csrf-token']");

  if (element) {
    return element.getAttribute("content");
  } else {
    return null;
  }
}

function axiosMultipart() {
  let req = axios.create();

  req.defaults.headers.common["Content-Type"] = "multipart/form-data";
  req.defaults.headers.common["x-csrf-token"] = csrftoken();

  return req;
}

function uploadImage(file: File): Promise<any> {
  const form = new FormData();
  form.append("file", file);

  return axiosMultipart().post("/blobs", form);
}

export const createImageExtension = (uploadFn: UploadFn) => {
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
      return [dropImagePlugin(uploadFn)];
    },
  });
};

function EditableImageView({ node, deleteNode, updateAttributes }) {
  const disableEnter = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      return;
    }
  };

  const updateTitle = (e: React.FocusEvent<HTMLSpanElement>) => {
    updateAttributes({
      alt: e.target.innerText,
      title: e.target.innerText,
    });
  };

  return (
    <NodeViewWrapper className="blob-container relative group">
      <img
        src={node.attrs.src}
        alt={node.attrs.alt}
        title={node.attrs.title}
        className="group-hover:border-white-3 transition-colors"
        data-drag-handle
      />

      <div className="footer flex items-center justify-center">
        <NodeViewContent
          className="title outline-none"
          contentEditable={true}
          suppressContentEditableWarning={true}
          onKeyDown={disableEnter}
          onBlur={updateTitle}
        >
          {node.attrs.alt}
        </NodeViewContent>
      </div>

      <div className="absolute top-2 right-2 p-2 hover:scale-105 bg-red-400 rounded-full group-hover:opacity-100 opacity-0 cursor-pointer transition-opacity">
        <Icons.IconTrash onClick={deleteNode} size={16} className="text-white-1" />
      </div>
    </NodeViewWrapper>
  );
}

export const dropImagePlugin = (upload: UploadFn) => {
  return new Plugin({
    props: {
      handlePaste(view, event, slice) {
        const items = Array.from(event.clipboardData?.items || []);
        const { schema } = view.state;

        items.forEach((item) => {
          const image = item.getAsFile();

          if (item.type.indexOf("image") === 0) {
            event.preventDefault();

            if (upload && image) {
              upload(image).then((src) => {
                const node = schema.nodes.image.create({
                  src: src,
                });
                const transaction = view.state.tr.replaceSelectionWith(node);
                view.dispatch(transaction);
              });
            }
          } else {
            const reader = new FileReader();
            reader.onload = (readerEvent) => {
              const node = schema.nodes.image.create({
                src: readerEvent.target?.result,
              });
              const transaction = view.state.tr.replaceSelectionWith(node);
              view.dispatch(transaction);
            };
            if (!image) return;
            reader.readAsDataURL(image);
          }
        });

        return false;
      },
      handleDOMEvents: {
        drop: (view, event) => {
          const hasFiles = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length;
          if (!hasFiles) return false;

          const images = Array.from(event.dataTransfer?.files ?? []).filter((file) => /image/i.test(file.type));

          if (images.length === 0) {
            return false;
          }

          event.preventDefault();

          const { schema } = view.state;
          const coordinates = view.posAtCoords({
            left: event.clientX,
            top: event.clientY,
          });
          if (!coordinates) return false;

          const blobSchema = schema.nodes.blob;
          if (!blobSchema) return false;

          images.forEach(async (image) => {
            const reader = new FileReader();

            if (upload) {
              const res = await upload(image);
              const node = blobSchema.create({
                src: res.data.path,
                title: image.name,
                alt: image.name,
              });

              const transaction = view.state.tr.insert(coordinates.pos, node);
              view.dispatch(transaction);
            } else {
              reader.onload = (readerEvent) => {
                const node = blobSchema.create({ src: readerEvent.target?.result });
                const transaction = view.state.tr.insert(coordinates.pos, node);
                view.dispatch(transaction);
              };
              reader.readAsDataURL(image);
            }
          });

          return true;
        },
      },
    },
  });
};

export default createImageExtension(uploadImage);
