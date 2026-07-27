import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";

import { FileDragAndDropArea } from "./FileDragAndDropArea";

function overlay(): HTMLElement {
  const node = document.querySelector(".fixed.inset-0");
  if (!node) throw new Error("overlay not found");
  return node as HTMLElement;
}

describe("FileDragAndDropArea", () => {
  test("renders its children and a hidden dropzone by default", () => {
    render(
      <FileDragAndDropArea onFilesDropped={jest.fn()}>
        <div>child content</div>
      </FileDragAndDropArea>,
    );

    expect(screen.getByText("child content")).toBeInTheDocument();
    expect(overlay()).toHaveClass("opacity-0");
    expect(overlay()).toHaveClass("pointer-events-none");
  });

  test("reveals the dropzone when files are dragged anywhere on the page and hides it when they leave", () => {
    render(
      <FileDragAndDropArea onFilesDropped={jest.fn()}>
        <div>child content</div>
      </FileDragAndDropArea>,
    );

    // The whole document is a drop target, so dragging over the body (not just the
    // rendered children) must reveal the overlay. This is the fix for the tiny dropzone.
    fireEvent.dragEnter(document.body, { dataTransfer: { types: ["Files"], files: [] } });
    expect(overlay()).toHaveClass("opacity-100");
    expect(overlay()).toHaveClass("pointer-events-auto");

    fireEvent.dragLeave(document.body, { dataTransfer: { types: ["Files"], files: [] } });
    expect(overlay()).toHaveClass("opacity-0");
  });

  test("ignores drags that do not carry files", () => {
    render(
      <FileDragAndDropArea onFilesDropped={jest.fn()}>
        <div>child content</div>
      </FileDragAndDropArea>,
    );

    fireEvent.dragEnter(document.body, { dataTransfer: { types: ["text/plain"], files: [] } });
    expect(overlay()).toHaveClass("opacity-0");
  });

  test("calls onFilesDropped when files are dropped anywhere on the page", () => {
    const onFilesDropped = jest.fn();
    render(
      <FileDragAndDropArea onFilesDropped={onFilesDropped}>
        <div>child content</div>
      </FileDragAndDropArea>,
    );
    const files = [new File(["a"], "a.txt", { type: "text/plain" })];

    fireEvent.drop(document.body, { dataTransfer: { types: ["Files"], files } });

    expect(onFilesDropped).toHaveBeenCalledWith(files);
    expect(overlay()).toHaveClass("opacity-0");
  });

  test("renders a custom label", () => {
    render(
      <FileDragAndDropArea onFilesDropped={jest.fn()} label="Drop files into Docs & Files">
        <div>child content</div>
      </FileDragAndDropArea>,
    );

    expect(screen.getByText("Drop files into Docs & Files")).toBeInTheDocument();
  });
});
