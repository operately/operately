import { Plugin } from "prosemirror-state";
import { FileUploader } from "./FileUploader";

export const createPasteFilePlugin = (uploader: FileUploader) => {
  return new Plugin({
    props: {
      handlePaste(view, event, _slice) {
        const items = Array.from(event.clipboardData?.items || []);
        const { schema } = view.state;

        items.forEach((item) => {
          const image = item.getAsFile();

          if (item.type.indexOf("image") === 0) {
            event.preventDefault();

            if (image) {
              uploader.upload(image).then((path) => {
                const node = schema.nodes.image.create({ src: path });
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
    },
  });
};
