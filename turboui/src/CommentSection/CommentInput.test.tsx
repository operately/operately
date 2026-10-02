import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import type { JSONContent } from "@tiptap/core";

import { CommentInput } from "./CommentInput";
import { showErrorToast } from "../Toasts";

const clearLocalDraft = jest.fn();

jest.mock("../RichEditor", () => ({
  hasLocalDraft: () => false,
  useEditor: () => {
    const [content, setContent] = React.useState<JSONContent>({});
    const editor = React.useMemo(() => ({ commands: { setContent } }), []);
    return { editor, content, setContent, getJson: () => content, empty: !content.text, clearLocalDraft };
  },
  Editor: ({ editor }: { editor: { content: JSONContent; setContent: (content: JSONContent) => void } }) => (
    <textarea
      aria-label="Comment"
      value={editor.content.text ?? ""}
      onChange={(event) => editor.setContent({ type: "text", text: event.target.value })}
    />
  ),
}));
jest.mock("../Toasts", () => ({ showErrorToast: jest.fn() }));
beforeEach(() => jest.clearAllMocks());

function deferred() {
  let resolve: (value: boolean | undefined) => void = () => {};
  let reject: (error: Error) => void = () => {};
  const promise = new Promise<boolean | undefined>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function renderInput(postComment: jest.Mock) {
  return render(
    <CommentInput
      currentUser={{ id: "maya", fullName: "Maya", avatarUrl: null, profileLink: "#" }}
      form={{ items: [], submitting: false, postComment, editComment: jest.fn() }}
      richTextHandlers={{ mentionedPersonLookup: async () => null, resolveResourceLinks: null }}
    />,
  );
}

function writeComment(text: string) {
  const trigger = document.querySelector<HTMLElement>('[data-test-id="add-comment"]');
  if (!trigger) throw new Error("Expected an inactive composer");
  fireEvent.click(trigger);
  fireEvent.change(screen.getByRole("textbox"), { target: { value: text } });
}

it.each([true, undefined])("closes immediately, without waiting for success (%s)", async (result) => {
  const request = deferred();
  const postComment = jest.fn(() => request.promise);
  renderInput(postComment);
  writeComment("First comment");

  fireEvent.click(screen.getByRole("button", { name: "Post" }));
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  expect(postComment).toHaveBeenCalledWith({ type: "text", text: "First comment" });

  // Finishing an earlier request must not close or clear a newer draft.
  writeComment("Next comment");
  await act(async () => {
    request.resolve(result);
  });
  expect(screen.getByRole("textbox")).toHaveValue("Next comment");
  expect(clearLocalDraft).toHaveBeenCalledTimes(1);
  expect(showErrorToast).not.toHaveBeenCalled();
});

it.each(["false", "rejection", "throw"])("restores a failed draft (%s) and allows retry", async (failure) => {
  const request = deferred();
  const postComment = jest.fn().mockResolvedValue(true);
  postComment.mockImplementationOnce(() => {
    if (failure === "throw") throw new Error("Failed");
    return request.promise;
  });
  renderInput(postComment);
  writeComment("Keep my draft");
  fireEvent.click(screen.getByRole("button", { name: "Post" }));
  if (failure !== "throw") {
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    await act(async () => {
      if (failure === "false") request.resolve(false);
      else request.reject(new Error("Failed"));
    });
  }
  expect(await screen.findByRole("textbox")).toHaveValue("Keep my draft");
  expect(showErrorToast).toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Post" }));
  await waitFor(() => expect(postComment).toHaveBeenCalledTimes(2));
  expect(postComment).toHaveBeenLastCalledWith({ type: "text", text: "Keep my draft" });
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
});

it.each(["editing", "cancelled", "posted"])(
  "discards an earlier failed comment once a newer comment has been started (%s)",
  async (newerComment) => {
    const request = deferred();
    renderInput(jest.fn().mockReturnValueOnce(request.promise).mockResolvedValue(true));
    writeComment("Failed comment");
    fireEvent.click(screen.getByRole("button", { name: "Post" }));
    writeComment("New draft");
    if (newerComment === "cancelled") fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    if (newerComment === "posted") fireEvent.click(screen.getByRole("button", { name: "Post" }));

    await act(async () => {
      request.resolve(false);
    });
    expect(showErrorToast).toHaveBeenCalledWith("Comment not posted", "Please try again.");
    if (newerComment === "editing") {
      expect(screen.getByRole("textbox")).toHaveValue("New draft");
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    }
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    writeComment("");
    expect(screen.getByRole("textbox")).toHaveValue("");
  },
);

it("does not reopen the composer or notify after its owner unmounts", async () => {
  const request = deferred();
  const view = renderInput(jest.fn(() => request.promise));
  writeComment("Comment on the previous page");
  fireEvent.click(screen.getByRole("button", { name: "Post" }));
  view.unmount();
  await act(async () => {
    request.resolve(false);
  });
  expect(showErrorToast).not.toHaveBeenCalled();
});
