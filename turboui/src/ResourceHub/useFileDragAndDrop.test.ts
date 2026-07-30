import { act, renderHook } from "@testing-library/react";

import { useFileDragAndDrop } from "./useFileDragAndDrop";

// Dispatches a drag event on the document, mirroring how the browser delivers
// file drags to the listeners registered by the hook.
function dispatchDrag(type: string, { types = ["Files"], files = [] as File[] } = {}) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, "dataTransfer", {
    value: { types, files },
    configurable: true,
  });

  act(() => {
    document.dispatchEvent(event);
  });

  return event;
}

describe("useFileDragAndDrop", () => {
  test("activates the dropzone when files are dragged over the document", () => {
    const { result } = renderHook(() => useFileDragAndDrop(jest.fn()));

    expect(result.current.isFileDragging).toBe(false);

    dispatchDrag("dragenter");

    expect(result.current.isFileDragging).toBe(true);
  });

  test("ignores drags that do not contain files", () => {
    const onDrop = jest.fn();
    const { result } = renderHook(() => useFileDragAndDrop(onDrop));

    const event = dispatchDrag("dragenter", { types: ["text/plain"] });
    dispatchDrag("dragover", { types: ["text/plain"] });

    expect(result.current.isFileDragging).toBe(false);
    // Non-file drags must not be captured, so the default must not be prevented.
    expect(event.defaultPrevented).toBe(false);
  });

  test("stays active while moving across nested child elements", () => {
    const { result } = renderHook(() => useFileDragAndDrop(jest.fn()));

    dispatchDrag("dragenter"); // enter container
    dispatchDrag("dragenter"); // enter child

    expect(result.current.isFileDragging).toBe(true);

    dispatchDrag("dragleave"); // leave child, still inside container

    expect(result.current.isFileDragging).toBe(true);

    dispatchDrag("dragleave"); // leave the view entirely

    expect(result.current.isFileDragging).toBe(false);
  });

  test("invokes the callback with dropped files and deactivates", () => {
    const onDrop = jest.fn();
    const { result } = renderHook(() => useFileDragAndDrop(onDrop));
    const files = [new File(["a"], "a.txt", { type: "text/plain" })];

    dispatchDrag("dragenter");
    dispatchDrag("drop", { files });

    expect(onDrop).toHaveBeenCalledWith(files);
    expect(result.current.isFileDragging).toBe(false);
  });

  test("does not invoke the callback when no files are dropped", () => {
    const onDrop = jest.fn();
    renderHook(() => useFileDragAndDrop(onDrop));

    dispatchDrag("drop", { files: [] });

    expect(onDrop).not.toHaveBeenCalled();
  });

  test("uses the latest callback without re-binding listeners", () => {
    const first = jest.fn();
    const second = jest.fn();
    const { rerender } = renderHook(({ cb }) => useFileDragAndDrop(cb), {
      initialProps: { cb: first },
    });

    rerender({ cb: second });

    const files = [new File(["a"], "a.txt", { type: "text/plain" })];
    dispatchDrag("drop", { files });

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith(files);
  });

  test("stops listening after unmount", () => {
    const onDrop = jest.fn();
    const { unmount } = renderHook(() => useFileDragAndDrop(onDrop));

    unmount();

    dispatchDrag("drop", { files: [new File(["a"], "a.txt")] });

    expect(onDrop).not.toHaveBeenCalled();
  });
});
