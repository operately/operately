import { Plugin } from "prosemirror-state";
import { AddBlobsEditorCommand } from "./AddBlobsEditorCommand";

export const DropFilePlugin = new Plugin({
  props: {
    handleDOMEvents: {
      dragover: (view, _event) => {
        view.dom.classList.add("dragover");
      },

      dragleave: (view, event) => {
        if (event.target === view.dom) {
          view.dom.classList.remove("dragover");
        }
      },

      dragend: (view, _event) => {
        view.dom.classList.remove("dragover");
      },

      drop: (view, event) => {
        view.dom.classList.remove("dragover");

        if (!isThereAnyFileInEvent(event)) return false;

        const images = Array.from(event.dataTransfer?.files ?? []).filter((file) => /image/i.test(file.type));

        if (images.length === 0) return false;

        event.preventDefault();

        const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
        if (!coordinates) return false;

        AddBlobsEditorCommand({
          files: images,
          pos: coordinates.pos,
          view: view,
        });

        return true;
      },
    },
  },
});

function isThereAnyFileInEvent(event: DragEvent) {
  return event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length;
}
