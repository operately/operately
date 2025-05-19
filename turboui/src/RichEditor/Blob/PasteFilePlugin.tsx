import { Plugin } from "prosemirror-state";
import { AddBlobsEditorCommand } from "./AddBlobsEditorCommand";

export const PasteFilePlugin = new Plugin({
  props: {
    handlePaste(view, event, _slice) {
      if (!view.editable) return false;

      const items = Array.from(event.clipboardData?.items || []);

      items.forEach((item) => {
        const file = item.getAsFile();
        if (!file) return;

        if (item.type.indexOf("image") === 0) {
          event.preventDefault();

          AddBlobsEditorCommand({
            files: [file],
            pos: view.state.selection.from,
            view: view,
          });
        }
      });

      return false;
    },
  },
});
