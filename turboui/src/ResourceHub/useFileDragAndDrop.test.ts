import { act, renderHook } from "@testing-library/react";

import { useFileDragAndDrop } from "./useFileDragAndDrop";

type Handler = (event: React.DragEvent<HTMLDivElement>) => void;

function dragEvent({ types = ["Files"], files = [] as File[] } = {}) {
  return {
    preventDefault: jest.fn(),
    dataTransfer: {
      types,
      files,
    },
  } as unknown as React.DragEvent<HTMLDivElement>;
}

describe("useFileDragAndDrop", () => {
  test("activates the dropzone when files are dragged over", () => {
    const { result } = renderHook(() => useFileDragAndDrop(jest.fn()));

    expect(result.current.isFileDragging).toBe(false);

    act(() => {
      (result.current.onDragEnter as Handler)(dragEvent());
    });

    expect(result.current.isFileDragging).toBe(true);
  });

  test("ignores drags that do not contain files", () => {
    const onDrop = jest.fn();
    const { result } = renderHook(() => useFileDragAndDrop(onDrop));
    const event = dragEvent({ types: ["text/plain"] });

    act(() => {
      (result.current.onDragEnter as Handler)(event);
      (result.current.onDragOver as Handler)(event);
    });

    expect(result.current.isFileDragging).toBe(false);
    // Non-file drags must not be captured, so the default must not be prevented.
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  test("stays active while moving across nested child elements", () => {
    const { result } = renderHook(() => useFileDragAndDrop(jest.fn()));

    act(() => {
      (result.current.onDragEnter as Handler)(dragEvent()); // enter container
      (result.current.onDragEnter as Handler)(dragEvent()); // enter child
    });

    expect(result.current.isFileDragging).toBe(true);

    act(() => {
      (result.current.onDragLeave as Handler)(dragEvent()); // leave child, still inside container
    });

    expect(result.current.isFileDragging).toBe(true);

    act(() => {
      (result.current.onDragLeave as Handler)(dragEvent()); // leave container entirely
    });

    expect(result.current.isFileDragging).toBe(false);
  });

  test("invokes the callback with dropped files and deactivates", () => {
    const onDrop = jest.fn();
    const { result } = renderHook(() => useFileDragAndDrop(onDrop));
    const files = [new File(["a"], "a.txt", { type: "text/plain" })];

    act(() => {
      (result.current.onDragEnter as Handler)(dragEvent());
    });

    act(() => {
      (result.current.onDrop as Handler)(dragEvent({ files }));
    });

    expect(onDrop).toHaveBeenCalledWith(files);
    expect(result.current.isFileDragging).toBe(false);
  });

  test("does not invoke the callback when no files are dropped", () => {
    const onDrop = jest.fn();
    const { result } = renderHook(() => useFileDragAndDrop(onDrop));

    act(() => {
      (result.current.onDrop as Handler)(dragEvent({ files: [] }));
    });

    expect(onDrop).not.toHaveBeenCalled();
  });
});
