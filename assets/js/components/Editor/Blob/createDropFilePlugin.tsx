import { Plugin } from "prosemirror-state";
import { FileUploader } from "./FileUploader";

export const createDropFilePlugin = (uploader: FileUploader) => {
  return new Plugin({
    props: {
      handleDOMEvents: {
        dragover: (view, _event) => {
          view.dom.classList.add("dragover");
        },

        dragleave: (view, _event) => {
          view.dom.classList.remove("dragover");
        },

        dragend: (view, _event) => {
          view.dom.classList.remove("dragover");
        },

        drop: (view, event) => {
          view.dom.classList.remove("dragover");

          if (!isThereAnyFileInEvent(event)) return false;

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
            const path = await uploader.upload(image);
            const node = blobSchema.create({ src: path, title: image.name, alt: image.name });

            const transaction = view.state.tr.insert(coordinates.pos, node);
            view.dispatch(transaction);
          });

          return true;
        },
      },
    },
  });
};

function isThereAnyFileInEvent(event: DragEvent) {
  return event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length;
}
