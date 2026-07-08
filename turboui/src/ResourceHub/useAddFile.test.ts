import { act, renderHook } from "@testing-library/react";

import { useAddFile } from "./useAddFile";

function mockFileInput() {
  const createdInputs: HTMLInputElement[] = [];
  const createElement = Document.prototype.createElement;

  jest.spyOn(document, "createElement").mockImplementation(function (this: Document, tagName: string) {
    const element = createElement.call(this, tagName);

    if (tagName === "input") {
      createdInputs.push(element as HTMLInputElement);
      jest.spyOn(element, "click").mockImplementation(() => undefined);
    }

    return element;
  });

  return createdInputs;
}

describe("useAddFile", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("selectFiles creates a file input that allows multiple selection", () => {
    const createdInputs = mockFileInput();
    const { result } = renderHook(() => useAddFile());

    act(() => {
      result.current.selectFiles();
    });

    expect(createdInputs).toHaveLength(1);
    expect(createdInputs[0]?.type).toBe("file");
    expect(createdInputs[0]?.multiple).toBe(true);
  });

  test("selectFiles stores all selected files", () => {
    const createdInputs = mockFileInput();
    const { result } = renderHook(() => useAddFile());
    const files = [
      new File(["one"], "one.txt", { type: "text/plain" }),
      new File(["two"], "two.txt", { type: "text/plain" }),
    ];

    act(() => {
      result.current.selectFiles();
    });

    const fileInput = createdInputs[0];
    Object.defineProperty(fileInput, "files", {
      value: files,
      configurable: true,
    });

    act(() => {
      fileInput?.onchange?.({ target: fileInput } as unknown as Event);
    });

    expect(result.current.files).toEqual(files);
    expect(result.current.filesSelected).toBe(true);
  });
});
