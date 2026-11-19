import React from "react";
import { configure, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { GoalTargetList } from ".";

configure({ testIdAttribute: "data-test-id" });

jest.mock("../utils/PragmaticDragAndDrop", () => ({
  projectItemsWithPlaceholder: ({ items }: { items: unknown[] }) => ({ items, placeholderIndex: null }),
  SubtleDropPlaceholder: () => null,
  DragHandle: () => null,
  useBoardDnD: () => ({ draggedItemId: null, destination: null, draggedItemDimensions: null }),
  useSortableItem: () => ({ ref: () => undefined, isDragging: false }),
}));

for (const mode of ["add", "edit"] as const) {
  describe(`${mode} target`, () => {
    function setup() {
      const addTarget = jest.fn().mockResolvedValue({ success: true, id: "new-target" });
      const updateTarget = jest.fn().mockResolvedValue(true);
      const onAddActiveChange = jest.fn();
      render(
        <GoalTargetList
          targets={
            mode === "edit"
              ? [{ id: "target", name: "Revenue", unit: "USD", from: 0, to: 100, value: 0, index: 0, mode: "edit" }]
              : []
          }
          addActive={mode === "add"}
          onAddActiveChange={onAddActiveChange}
          addTarget={addTarget}
          updateTarget={updateTarget}
          deleteTarget={jest.fn()}
          updateTargetValue={jest.fn()}
          updateTargetIndex={jest.fn()}
        />,
      );
      const name = screen.getByTestId("target-name");
      const unit = screen.getByTestId("target-unit");
      for (const [field, value] of [
        ["name", "Revenue"],
        ["from", "0"],
        ["to", "100"],
        ["unit", "USD"],
      ]) {
        fireEvent.change(screen.getByTestId(`target-${field}`), { target: { value } });
      }
      return { submit: mode === "add" ? addTarget : updateTarget, name, unit, onAddActiveChange };
    }

    for (const field of ["name", "unit"] as const) {
      test.each(["a".repeat(256), "e\u0301".repeat(128)])(
        `keeps oversized ${field} editable and permits correction (%#)`,
        async (value) => {
          const form = setup();
          fireEvent.change(form[field], { target: { value } });
          fireEvent.click(screen.getByTestId("save"));
          expect(await screen.findByText("Must be at most 255 characters long")).toBeVisible();
          expect(form.submit).not.toHaveBeenCalled();
          expect(form.onAddActiveChange).not.toHaveBeenCalled();
          expect(form[field]).toHaveValue(value);

          const corrected = "😀".repeat(255);
          fireEvent.change(form[field], { target: { value: corrected } });
          fireEvent.click(screen.getByTestId("save"));
          await waitFor(() =>
            expect(form.submit).toHaveBeenCalledWith(expect.objectContaining({ [field]: corrected })),
          );
        },
      );

      test(`rejects whitespace-only ${field}`, async () => {
        const form = setup();
        fireEvent.change(form[field], { target: { value: "   " } });
        fireEvent.click(screen.getByTestId("save"));
        expect(await screen.findByText("Can't be empty")).toBeVisible();
        expect(form.submit).not.toHaveBeenCalled();
        expect(form.onAddActiveChange).not.toHaveBeenCalled();
      });
    }
  });
}
