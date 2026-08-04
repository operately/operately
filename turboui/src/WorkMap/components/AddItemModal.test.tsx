import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

import { AddItemModal } from "./AddItemModal";

const generalSpace = { id: "general", name: "General", link: "/spaces/general" };

describe("AddItemModal", () => {
  it("stops submitting when validation fails", async () => {
    const user = userEvent.setup();
    const save = jest.fn();

    render(
      <AddItemModal
        isOpen
        close={jest.fn()}
        parentGoal={null}
        spaceSearch={jest.fn().mockResolvedValue([generalSpace])}
        save={save}
        space={generalSpace}
      />,
    );

    const submitButton = screen.getByRole("button", { name: "Add Goal" });
    await user.click(submitButton);

    expect(await screen.findByText("Cannot be empty")).toBeInTheDocument();
    expect(submitButton).toBeEnabled();
    expect(save).not.toHaveBeenCalled();
  });
});
