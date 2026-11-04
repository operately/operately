import { i18n, setupTestCatalog } from "../../test/i18n";
import * as React from "react";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom";

import { Reactions } from ".";
import { showErrorToast } from "../Toasts";

jest.mock("../Toasts", () => ({ showErrorToast: jest.fn() }));
beforeEach(() => jest.clearAllMocks());

describe.each([false, true])("removal mode (shadow root: %s)", (shadow) => {
  let host: HTMLDivElement;
  let view: ReturnType<typeof render>;
  let list: Element;
  let reaction: Element;
  let onRemoveReaction: jest.Mock;

  beforeEach(() => {
    host = document.createElement("div");
    document.body.append(host);
    const container = document.createElement("div");
    (shadow ? host.attachShadow({ mode: "open" }) : host).append(container);
    onRemoveReaction = jest.fn();
    view = render(
      <Reactions
        reactions={[
          {
            id: "reaction-1",
            emoji: "👍",
            person: { id: "alex", fullName: "Alex", avatarUrl: null, profileLink: "#" },
          },
        ]}
        currentPersonId="alex"
        onAddReaction={() => {}}
        onRemoveReaction={onRemoveReaction}
      />,
      { container },
    );
    const reactionItem = container.querySelector("[data-reaction-item]");
    if (!reactionItem?.parentElement) throw new Error("Reaction list missing");
    reaction = reactionItem;
    list = reactionItem.parentElement;
    fireEvent.click(reaction);
    expect(view.queryByTitle("Remove reaction")).not.toBeNull();
  });

  afterEach(() => {
    view.unmount();
    host.remove();
  });

  it("dismisses removal mode when clicking empty space in the list", () => {
    fireEvent.click(list);
    expect(view.queryByTitle("Remove reaction")).toBeNull();
  });

  it("dismisses removal mode when opening the add-reaction picker", () => {
    const trigger = list.querySelector('[aria-haspopup="dialog"]');
    if (!trigger) throw new Error("Reaction picker trigger missing");
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(view.queryByTitle("Remove reaction")).toBeNull();
  });

  it("reports rejected removals without removing the reaction", async () => {
    onRemoveReaction.mockRejectedValueOnce(new Error("Removal failed"));
    fireEvent.click(view.getByTitle("Remove reaction"));
    await waitFor(() => expect(showErrorToast).toHaveBeenCalled());
    expect(reaction).toBeInTheDocument();
    fireEvent.click(reaction);
    fireEvent.click(view.getByTitle("Remove reaction"));
    expect(onRemoveReaction).toHaveBeenCalledTimes(2);
  });

  it("still toggles removal mode and removes the selected reaction", () => {
    fireEvent.click(reaction);
    expect(view.queryByTitle("Remove reaction")).toBeNull();
    fireEvent.click(reaction);
    fireEvent.click(view.getByTitle("Remove reaction"));
    expect(onRemoveReaction).toHaveBeenCalledWith("reaction-1");
    expect(view.queryByTitle("Remove reaction")).toBeNull();
  });
});

it.each(["success", "failure"])(
  "closes immediately and does not close a reopened picker after save %s",
  async (outcome) => {
    let finishSave = () => {};
    const error = new Error("Save failed");
    const saving = new Promise<void>((resolve, reject) => {
      finishSave = () => (outcome === "success" ? resolve() : reject(error));
    });
    const onAddReaction = jest.fn(() => saving);

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
      expect(showErrorToast).toHaveBeenCalledWith("Reaction not added", "Please try again.");
    }
  },
);

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

setupTestCatalog();

describe("picker keyboard navigation", () => {
  function openPicker() {
    const onAddReaction = jest.fn();
    const { container } = render(<Reactions reactions={[]} onAddReaction={onAddReaction} />);
    const trigger = container.querySelector('[aria-haspopup="dialog"]');
    if (!trigger) throw new Error("Reaction picker trigger missing");
    fireEvent.click(trigger);
    return { trigger, search: screen.getByRole("textbox"), onAddReaction };
  }

  function emojiButton(emoji: string) {
    const button = screen.getByText(emoji).closest("button");
    if (!button) throw new Error(`Emoji button missing: ${emoji}`);
    return button;
  }

  const originalScrollIntoView = Element.prototype.scrollIntoView;

  beforeEach(() => {
    Element.prototype.scrollIntoView = jest.fn();
  });

  afterEach(() => {
    Element.prototype.scrollIntoView = originalScrollIntoView;
  });

  it("selects the first search result with Enter and restores focus", async () => {
    const { trigger, search, onAddReaction } = openPicker();
    expect(search).toHaveFocus();
    fireEvent.change(search, { target: { value: "salute" } });
    fireEvent.keyDown(search, { key: "Enter" });
    expect(onAddReaction).toHaveBeenCalledWith("🫡");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("moves across eight-column rows and returns to search from the first row", () => {
    const { search } = openPicker();
    fireEvent.keyDown(search, { key: "ArrowDown" });
    expect(emojiButton("👍")).toHaveFocus();
    fireEvent.keyDown(emojiButton("👍"), { key: "ArrowLeft" });
    expect(emojiButton("👍")).toHaveFocus();
    fireEvent.keyDown(emojiButton("👍"), { key: "ArrowRight" });
    expect(emojiButton("❤️")).toHaveFocus();
    fireEvent.keyDown(emojiButton("❤️"), { key: "ArrowDown" });
    expect(emojiButton("👏")).toHaveFocus();
    fireEvent.keyDown(emojiButton("👏"), { key: "ArrowLeft" });
    expect(emojiButton("💪")).toHaveFocus();
    fireEvent.keyDown(emojiButton("💪"), { key: "ArrowUp" });
    expect(emojiButton("👍")).toHaveFocus();
    expect(emojiButton("👍").scrollIntoView).toHaveBeenCalledWith({ block: "nearest", inline: "nearest" });
    const tabStops = within(screen.getByRole("grid"))
      .getAllByRole("button")
      .filter((button) => button.tabIndex === 0);
    expect(tabStops).toEqual([emojiButton("👍")]);
    fireEvent.keyDown(emojiButton("👍"), { key: "ArrowUp" });
    expect(search).toHaveFocus();
  });

  it("handles the incomplete final row without wrapping or losing focus", () => {
    const { search } = openPicker();
    const buttons = within(screen.getByRole("grid")).getAllByRole("button");
    const last = buttons.at(-1);
    if (!last) throw new Error("Expected emojis");
    fireEvent.keyDown(search, { key: "ArrowDown" });
    for (let column = 1; column < 8; column++)
      fireEvent.keyDown(document.activeElement ?? search, { key: "ArrowRight" });
    for (let row = 1; row < Math.ceil(buttons.length / 8); row++) {
      fireEvent.keyDown(document.activeElement ?? search, { key: "ArrowDown" });
    }
    expect(last).toHaveFocus();
    fireEvent.keyDown(last, { key: "ArrowDown" });
    fireEvent.keyDown(last, { key: "ArrowRight" });
    expect(last).toHaveFocus();
  });

  it("resets navigation after filtering and ignores empty results and IME confirmation", () => {
    const { search, onAddReaction } = openPicker();
    fireEvent.keyDown(search, { key: "ArrowDown" });
    fireEvent.keyDown(emojiButton("👍"), { key: "ArrowDown" });
    act(() => search.focus());
    fireEvent.change(search, { target: { value: "no-such-emoji" } });
    fireEvent.keyDown(search, { key: "ArrowDown" });
    fireEvent.keyDown(search, { key: "Enter" });
    expect(search).toHaveFocus();
    expect(onAddReaction).not.toHaveBeenCalled();
    fireEvent.change(search, { target: { value: "salute" } });
    fireEvent.keyDown(search, { key: "Enter", isComposing: true });
    expect(onAddReaction).not.toHaveBeenCalled();
    fireEvent.keyDown(search, { key: "ArrowDown" });
    expect(emojiButton("🫡")).toHaveFocus();
    expect(emojiButton("🫡")).toHaveAttribute("tabindex", "0");
  });

  it("dismisses with Escape and restores focus to the trigger", async () => {
    const { trigger, search, onAddReaction } = openPicker();
    fireEvent.keyDown(search, { key: "ArrowDown" });
    fireEvent.keyDown(document.activeElement ?? search, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onAddReaction).not.toHaveBeenCalled();
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});

it("finds reactions using Portuguese aliases without accents and retains English aliases", async () => {
  await i18n.changeLanguage("pt-BR");
  const onAddReaction = jest.fn();
  const { container } = render(<Reactions reactions={[]} onAddReaction={onAddReaction} onRemoveReaction={jest.fn()} />);
  const trigger = container.querySelector('[aria-haspopup="dialog"]');
  if (!trigger) throw new Error("Reaction picker trigger missing");
  fireEvent.click(trigger);
  const search = screen.getByRole("textbox");
  fireEvent.change(search, { target: { value: "coracao" } });
  expect(screen.getByText("❤️")).toBeInTheDocument();
  fireEvent.change(search, { target: { value: "heart" } });
  fireEvent.click(screen.getByText("❤️"));
  expect(onAddReaction).toHaveBeenCalledWith("❤️");
});
