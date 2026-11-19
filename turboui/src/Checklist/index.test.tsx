import React from "react";
import { configure, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Checklist } from ".";

configure({ testIdAttribute: "data-test-id" });

jest.mock("../utils/PragmaticDragAndDrop", () => ({
  projectItemsWithPlaceholder: ({ items }: { items: unknown[] }) => ({ items, placeholderIndex: null }),
  SubtleDropPlaceholder: () => null,
  DragHandle: () => null,
  useBoardDnD: () => ({ draggedItemId: null, destination: null, draggedItemDimensions: null }),
  useSortableItem: () => ({ ref: () => undefined, isDragging: false }),
}));

for (const mode of ["add", "edit"] as const) {
  describe(`${mode} checklist item`, () => {
    function setup() {
      const addItem = jest.fn().mockResolvedValue({ success: true, id: "new-check" });
      const updateItem = jest.fn().mockResolvedValue(true);
      render(
        <Checklist
          canEdit
          items={mode === "edit" ? [{ id: "check", name: "Original", completed: false, index: 0, mode: "edit" }] : []}
          addItem={addItem}
          updateItem={updateItem}
          deleteItem={jest.fn()}
          toggleItem={jest.fn()}
          updateItemIndex={jest.fn()}
        />,
      );
      if (mode === "add") fireEvent.click(screen.getByTestId("add-checklist-item"));
      return { submit: mode === "add" ? addItem : updateItem };
    }

    test("rejects whitespace-only names", async () => {
      const { submit } = setup();
      fireEvent.change(screen.getByRole("textbox"), { target: { value: "   " } });
      fireEvent.click(screen.getByTestId("save"));
      expect(await screen.findByText("Can't be empty")).toBeVisible();
      expect(submit).not.toHaveBeenCalled();
    });

    test.each(["a".repeat(256), "e\u0301".repeat(128)])(
      "keeps oversized input editable and permits correction (%#)",
      async (name) => {
        const { submit } = setup();
        fireEvent.change(screen.getByRole("textbox"), { target: { value: name } });
        fireEvent.click(screen.getByTestId("save"));

        expect(await screen.findByText("Must be at most 255 characters long")).toBeVisible();
        expect(submit).not.toHaveBeenCalled();
        expect(screen.getByRole("textbox")).toHaveValue(name);

        const corrected = "😀".repeat(255);
        fireEvent.change(screen.getByRole("textbox"), { target: { value: corrected } });
        fireEvent.click(screen.getByTestId("save"));
        await waitFor(() => expect(submit).toHaveBeenCalledWith(expect.objectContaining({ name: corrected })));
      },
    );
  });
}
