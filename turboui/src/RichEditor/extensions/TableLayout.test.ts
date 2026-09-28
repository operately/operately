import { Editor } from "@tiptap/core";
import { waitFor } from "@testing-library/react";
import { createRichEditorExtensions } from "../createRichEditorExtensions";
import { assertPresent } from "../../utils/assertions";

let editor: Editor;
let mount: HTMLDivElement;
let measurements: jest.SpyInstance;
let tableClones: jest.SpyInstance;
const originalFonts = Object.getOwnPropertyDescriptor(document, "fonts");
const fonts = Object.assign(new EventTarget(), { ready: Promise.resolve() });

beforeAll(() => Object.defineProperty(document, "fonts", { configurable: true, value: fonts }));
afterAll(() => {
  if (originalFonts) Object.defineProperty(document, "fonts", originalFonts);
  else Reflect.deleteProperty(document, "fonts");
});

beforeEach(async () => {
  mount = document.createElement("div");
  document.body.appendChild(mount);
  jest.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(600);
  measurements = jest.spyOn(HTMLTableCellElement.prototype, "getBoundingClientRect").mockImplementation(function (
    this: HTMLTableCellElement,
  ) {
    return { width: (this.textContent?.length ?? 0) * 10 + 24 } as DOMRect;
  });
  tableClones = jest.spyOn(HTMLTableElement.prototype, "cloneNode");
  editor = new Editor({
    element: mount,
    extensions: createRichEditorExtensions({}, { editable: false }),
    content: {
      type: "doc",
      content: [
        {
          type: "table",
          content: Array.from({ length: 40 }, (_, row) => ({
            type: "tableRow",
            content: [0, 1].map((column) => ({
              type: "tableCell",
              content: [{ type: "paragraph", content: [{ type: "text", text: `${row}-${column}` }] }],
            })),
          })),
        },
      ],
    },
  });
  editor.setEditable(true);
  await waitFor(() => expect(measurements).toHaveBeenCalled());
  measurements.mockClear();
  tableClones.mockClear();
});

afterEach(() => {
  editor.destroy();
  mount.remove();
  jest.restoreAllMocks();
});

it("measures only the edited cell when typing in a long table", async () => {
  const cell = editor.view.dom.querySelector("td");
  assertPresent(cell);
  editor.commands.setTextSelection(editor.view.posAtDOM(cell, 0) + 1);
  editor.commands.insertContent("A longer value");
  await waitFor(() => expect(measurements).toHaveBeenCalled());
  expect(measurements).toHaveBeenCalledTimes(1);
  expect(tableClones.mock.calls.every(([deep]) => !deep)).toBe(true);
});

it("remeasures only the changed cell after formatting and undo", async () => {
  const cell = editor.view.dom.querySelector("td");
  assertPresent(cell);
  const start = editor.view.posAtDOM(cell, 0) + 1;
  editor.commands.setTextSelection({ from: start, to: start + 3 });
  editor.commands.toggleBold();
  await waitFor(() => expect(measurements).toHaveBeenCalledTimes(1));
  measurements.mockClear();
  editor.commands.undo();
  await waitFor(() => expect(measurements).toHaveBeenCalledTimes(1));
});

it("invalidates natural widths when the viewport changes", async () => {
  const originalWidth = window.innerWidth;
  try {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: originalWidth - 1 });
    window.dispatchEvent(new Event("resize"));
    await waitFor(() => expect(measurements).toHaveBeenCalledTimes(80));
  } finally {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: originalWidth });
  }
});

it("remeasures after fonts finish loading", async () => {
  fonts.dispatchEvent(new Event("loadingdone"));
  await waitFor(() => expect(measurements).toHaveBeenCalledTimes(80));
});

it("forgets a removed widest cell without remeasuring the surviving cells", async () => {
  const cell = editor.view.dom.querySelector("td");
  assertPresent(cell);
  editor.commands.setTextSelection(editor.view.posAtDOM(cell, 0) + 1);
  editor.commands.insertContent("A".repeat(80));
  await waitFor(() => expect(editor.view.dom.querySelector("col")?.style.width).toBe("536px"));
  measurements.mockClear();
  editor.commands.deleteRow();
  await waitFor(() => expect(editor.view.dom.querySelector("col")?.style.width).toBe("300px"));
  expect(measurements).not.toHaveBeenCalled();
});
