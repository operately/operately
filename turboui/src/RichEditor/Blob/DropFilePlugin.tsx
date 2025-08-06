import { Plugin, PluginKey } from "prosemirror-state";
import { AddBlobsEditorCommand } from "./AddBlobsEditorCommand";
import { UploadFileFn } from "../useEditor";

export const createDropFilePlugin = (uploadFile: UploadFileFn) =>
  new Plugin({
    key: new PluginKey("dropFilePlugin"),

    props: {
      handleDOMEvents: {
        dragover: (view, _event) => {
          if (!view.editable) return false;

          view.dom.classList.add("dragover");
          return true;
        },

        dragleave: (view, event) => {
          if (!view.editable) return false;

          if (event.target === view.dom) {
            view.dom.classList.remove("dragover");
          }
          return true;
        },

        dragend: (view, _event) => {
          if (!view.editable) return false;

          view.dom.classList.remove("dragover");
          return true;
        },

        drop: (view, event) => {
          if (!view.editable) return false;

          view.dom.classList.remove("dragover");

          const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
          if (!coordinates) return false;

          const files = event.dataTransfer?.files;
          if (!files) return false;

          event.preventDefault();

          AddBlobsEditorCommand({
            files: files,
            pos: coordinates.pos,
            view: view,
            uploadFile: uploadFile,
          });

          return true;
        },
      },
    },
  });
