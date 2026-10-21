import React from "react";
import { fireEvent, render } from "@testing-library/react";

jest.mock("@atlaskit/pragmatic-drag-and-drop/element/adapter", () => ({
  dropTargetForElements: () => () => undefined,
}));

jest.mock("../utils/PragmaticDragAndDrop", () => ({
  DragHandle: () => null,
  SubtleDropPlaceholder: () => null,
  projectItemsWithPlaceholder: ({ items }: { items: unknown[] }) => ({ items, placeholderIndex: null }),
  useBoardDnD: () => ({ draggedItemId: null, destination: null, draggedItemDimensions: null }),
  useSortableItem: () => ({ ref: { current: null }, dragHandleRef: { current: null }, isDragging: false }),
}));

import { Checklist } from "./index";
import { CHECKLIST_NAME_MAX_LENGTH } from "./limitChecklistName";

const handlers = {
  addItem: async () => ({ success: true, id: "new" }),
  deleteItem: async () => true,
  updateItem: async () => true,
  toggleItem: async () => true,
  updateItemIndex: async () => true,
};

function nameInput(): HTMLInputElement {
  const input = document.querySelector('input[name="name"]');
  if (!(input instanceof HTMLInputElement)) throw new Error("Checklist name field was not rendered");
  return input;
}

describe("Checklist name length", () => {
  const name = "😀".repeat(CHECKLIST_NAME_MAX_LENGTH);

  it("lets the add field keep 2000 emoji and drops the next character", () => {
    render(<Checklist items={[]} canEdit {...handlers} />);
    const addButton = document.querySelector('[data-test-id="add-checklist-item"]');
    if (!(addButton instanceof HTMLElement)) throw new Error("Add button was not rendered");
    fireEvent.click(addButton);

    const input = nameInput();
    expect(input.getAttribute("maxlength")).toBeNull();
    fireEvent.change(input, { target: { value: `${name}x` } });
    expect(input.value).toBe(name);
  });

  it("lets the edit field keep 2000 emoji and drops the next character", () => {
    render(<Checklist items={[{ id: "1", name, completed: false, index: 0, mode: "edit" }]} canEdit {...handlers} />);

    const input = nameInput();
    expect(input.value).toBe(name);
    fireEvent.change(input, { target: { value: `${name}😀` } });
    expect(input.value).toBe(name);
  });
});
