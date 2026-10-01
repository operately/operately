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

it.each([false, true])("dismisses another list's removal mode across instances (shadow root: %s)", (shadow) => {
  const hosts = [document.createElement("div"), document.createElement("div")];
  const person = { id: "alex", fullName: "Alex", avatarUrl: null, profileLink: "#" };
  const views = hosts.map((host, index) => {
    document.body.append(host);
    const container = document.createElement("div");
    (shadow ? host.attachShadow({ mode: "open" }) : host).append(container);
    return render(
      <Reactions
        reactions={[{ id: String(index), emoji: "👍", person }]}
        currentPersonId="alex"
        canAddReaction={false}
        onRemoveReaction={() => {}}
      />,
      { container },
    );
  });
  const [first, second] = views;
  if (!first || !second) throw new Error("Expected two reaction lists");
  fireEvent.click(first.getByTitle("Click to remove your reaction"));
  expect(first.queryByTitle("Remove reaction")).not.toBeNull();
  fireEvent.click(second.getByTitle("Click to remove your reaction"));
  expect(first.queryByTitle("Remove reaction")).toBeNull();
  expect(second.queryByTitle("Remove reaction")).not.toBeNull();
  views.forEach((view) => view.unmount());
  hosts.forEach((host) => host.remove());
});
