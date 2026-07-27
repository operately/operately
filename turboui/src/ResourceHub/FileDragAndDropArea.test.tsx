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

  test("reveals the dropzone when files are dragged in and hides it when they leave", () => {
    const { container } = render(
      <FileDragAndDropArea onFilesDropped={jest.fn()}>
        <div>child content</div>
      </FileDragAndDropArea>,
    );
    const area = container.firstChild as HTMLElement;

    fireEvent.dragEnter(area, { dataTransfer: { types: ["Files"], files: [] } });
    expect(overlay()).toHaveClass("opacity-100");
    expect(overlay()).toHaveClass("pointer-events-auto");

    fireEvent.dragLeave(area, { dataTransfer: { types: ["Files"], files: [] } });
    expect(overlay()).toHaveClass("opacity-0");
  });

  test("ignores drags that do not carry files", () => {
    const { container } = render(
      <FileDragAndDropArea onFilesDropped={jest.fn()}>
        <div>child content</div>
      </FileDragAndDropArea>,
    );
    const area = container.firstChild as HTMLElement;

    fireEvent.dragEnter(area, { dataTransfer: { types: ["text/plain"], files: [] } });
    expect(overlay()).toHaveClass("opacity-0");
  });

  test("calls onFilesDropped with the dropped files", () => {
    const onFilesDropped = jest.fn();
    const { container } = render(
      <FileDragAndDropArea onFilesDropped={onFilesDropped}>
        <div>child content</div>
      </FileDragAndDropArea>,
    );
    const area = container.firstChild as HTMLElement;
    const files = [new File(["a"], "a.txt", { type: "text/plain" })];

    fireEvent.drop(area, { dataTransfer: { types: ["Files"], files } });

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
