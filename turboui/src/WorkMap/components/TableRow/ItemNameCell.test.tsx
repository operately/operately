import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { MemoryRouter } from "react-router";
import { setupTestCatalog } from "../../../../test/i18n";
import { mockSingleItem } from "../../tests/mockData";
import { ItemNameCell } from "./ItemNameCell";

setupTestCatalog();

describe("Work Map goal creation permissions", () => {
  it.each([false, undefined, true])(
    "requires destination space permission to add children: %s",
    async (canAddChildren) => {
      const user = userEvent.setup();
      const goal = { ...mockSingleItem, canAddChildren };
      render(
        <MemoryRouter>
          <table>
            <tbody>
              <tr>
                <ItemNameCell
                  item={goal}
                  level={0}
                  showIndentation={false}
                  expanded={false}
                  setExpanded={jest.fn()}
                  addingEnabled
                  addItem={jest.fn()}
                  spaceSearch={async () => []}
                />
              </tr>
            </tbody>
          </table>
        </MemoryRouter>,
      );

      const add = screen.getByRole("button", { name: "Add" });
      if (canAddChildren) {
        expect(add).toBeEnabled();
        await user.click(add);
        expect(document.querySelector('[data-test-id="add-item-modal"]')).toBeInTheDocument();
      } else {
        expect(add).toBeDisabled();
        expect(document.querySelector('[data-test-id="add-item-modal"]')).not.toBeInTheDocument();
        await user.tab();
        await user.tab();
        expect(await screen.findByRole("tooltip")).toHaveTextContent(
          "You need Edit access to this space to add goals and projects.",
        );
      }
    },
  );
});
