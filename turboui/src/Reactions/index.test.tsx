import * as React from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";

import { Reactions } from ".";

it.each(["success", "failure"])("closes immediately and does not close a reopened picker after save %s", async (outcome) => {
  let finishSave = () => {};
  const error = new Error("Save failed");
  const saving = new Promise<void>((resolve, reject) => {
    finishSave = () => (outcome === "success" ? resolve() : reject(error));
  });
  const onAddReaction = jest.fn(() => saving);
  const log = jest.spyOn(console, "error").mockImplementation(() => {});

  try {
    const { container } = render(<Reactions reactions={[]} onAddReaction={onAddReaction} />);
    const trigger = container.querySelector('[aria-haspopup="dialog"]');
    if (!trigger) throw new Error("Reaction picker trigger missing");

    fireEvent.click(trigger);
    fireEvent.click(within(screen.getByRole("dialog")).getByText("👍"));

    expect(onAddReaction).toHaveBeenCalledWith("👍");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(trigger);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await act(async () => {
      finishSave();
      await saving.catch(() => {});
    });

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    if (outcome === "failure") {
      expect(log).toHaveBeenCalledWith("Failed to add reaction", error);
    }
  } finally {
    log.mockRestore();
  }
});
