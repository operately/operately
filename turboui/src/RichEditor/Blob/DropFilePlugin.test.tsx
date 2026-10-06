import { EditorState } from "@tiptap/pm/state";
import { EditorView } from "@tiptap/pm/view";
import { createRichContentSchema } from "../../RichContentDiff/schema";
import { createDropFilePlugin } from "./DropFilePlugin";
import { i18n, setupTestCatalog } from "../../../test/i18n";

setupTestCatalog();

it("localizes the drop overlay each time it opens without changing document content", async () => {
  const state = EditorState.create({ schema: createRichContentSchema(), plugins: [createDropFilePlugin(jest.fn())] });
  const view = new EditorView(document.createElement("div"), { state });
  const before = view.state.doc.toJSON();
  try {
    await i18n.changeLanguage("pt-BR");
    view.dom.dispatchEvent(new Event("dragover", { bubbles: true }));
    expect(view.dom.getAttribute("data-drop-file-label")).toBe("Solte seus arquivos para adicioná-los");
    expect(view.dom.classList.contains("dragover")).toBe(true);
    view.dom.dispatchEvent(new Event("dragleave", { bubbles: true }));
    expect(view.dom.classList.contains("dragover")).toBe(false);
    await i18n.changeLanguage("en");
    view.dom.dispatchEvent(new Event("dragover", { bubbles: true }));
    expect(view.dom.getAttribute("data-drop-file-label")).toBe("Drop your files to add them");
    expect(view.state.doc.toJSON()).toEqual(before);
  } finally {
    view.destroy();
  }
});
