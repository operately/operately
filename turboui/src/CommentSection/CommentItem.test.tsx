import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { MemoryRouter } from "react-router";
import userEvent from "@testing-library/user-event";

import { defaultFormattedTimePreferences } from "../FormattedTime";
import { CommentItem } from "./CommentItem";
import { showErrorToast } from "../Toasts";

import type { CommentFormState } from "./types";

jest.mock("../Toasts", () => ({ showErrorToast: jest.fn(), showSuccessToast: jest.fn() }));
beforeEach(() => jest.clearAllMocks());

it.each([true, false])(
  "ordinary comments keep their copy link and author actions while submitting: owner=%s",
  async (owner) => {
    const user = userEvent.setup();
    const writeText = jest.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    const commentLink = new URL(window.location.href);
    commentLink.hash = comment.id;
    render(
      <MemoryRouter>
        <CommentItem
          comment={comment}
          form={{ ...form, submitting: true }}
          commentParentType="discussion"
          canComment
          currentUserId={owner ? comment.author.id : "another-person"}
          appearance="flat"
          richTextHandlers={{
            mentionedPersonLookup: async () => null,
            resolveResourceLinks: null,
            taskList: { canEdit: false },
            onCommentTaskItemChange: null,
          }}
          formattedTimePreferences={defaultFormattedTimePreferences}
        />
      </MemoryRouter>,
    );
    await user.click(getByTestId("comment-options"));
    expect(Boolean(document.querySelector('[data-test-id="edit-comment"]'))).toBe(owner);
    expect(Boolean(document.querySelector('[data-test-id="delete-comment"]'))).toBe(owner);
    await user.click(screen.getByText("Copy link"));
    expect(writeText).toHaveBeenCalledWith(commentLink.toString());
  },
);

const longCodeLine = "const endpoint = 'https://example.com/" + "a".repeat(200) + "';";

const comment = {
  id: "comment-with-long-code",
  content: JSON.stringify({
    type: "doc",
    content: [
      {
        type: "codeBlock",
        content: [{ type: "text", text: longCodeLine }],
      },
    ],
  }),
  author: {
    id: "author-1",
    fullName: "Jane Doe",
    avatarUrl: null,
    profileLink: "",
  },
  insertedAt: "2026-07-17T12:00:00Z",
  reactions: [],
};

const form: CommentFormState = {
  items: [],
  submitting: false,
  postComment: jest.fn(),
  editComment: jest.fn(),
  deleteComment: jest.fn(),
};

it("disabling editing closes an open editor and retains the delete action", async () => {
  const user = userEvent.setup();
  const item = (editDisabled: boolean) => (
    <MemoryRouter>
      <CommentItem
        comment={comment}
        form={form}
        commentParentType="inline_thread"
        canComment
        currentUserId={comment.author.id}
        appearance="inline"
        initiallyEditing
        editDisabled={editDisabled}
        richTextHandlers={{
          mentionedPersonLookup: async () => null,
          resolveResourceLinks: null,
          taskList: { canEdit: false },
          onCommentTaskItemChange: null,
        }}
        formattedTimePreferences={defaultFormattedTimePreferences}
      />
    </MemoryRouter>
  );
  const { rerender } = render(item(false));
  expect(getByTestId("edit-comment-form")).toBeInTheDocument();
  rerender(item(true));
  expect(document.querySelector('[data-test-id="edit-comment-form"]')).toBeNull();
  await user.click(getByTestId("comment-options"));
  expect(document.querySelector('[data-test-id="edit-comment"]')).toBeNull();
  expect(getByTestId("delete-comment")).toBeInTheDocument();
  await user.keyboard("{Escape}");
  rerender(item(false));
  expect(getByTestId("edit-comment-form")).toBeInTheDocument();
});

function getByTestId(testId: string) {
  const el = document.querySelector<HTMLElement>(`[data-test-id="${testId}"]`);
  if (!el) throw new Error(`Could not find element with data-test-id="${testId}"`);
  return el;
}

it.each([true, false])("uses the rich-text bundle with comment toggles enabled=%s", async (enabled) => {
  const user = userEvent.setup();
  const onCommentTaskItemChange = jest.fn().mockResolvedValue(undefined);
  const taskContent = {
    type: "doc",
    content: [
      {
        type: "taskList",
        content: [
          {
            type: "taskItem",
            attrs: { checked: false },
            content: [{ type: "paragraph", content: [{ type: "text", text: "Review" }] }],
          },
        ],
      },
    ],
  };
  render(
    <MemoryRouter>
      <CommentItem
        comment={{ ...comment, content: JSON.stringify(taskContent) }}
        form={form}
        commentParentType="task"
        canComment
        currentUserId={comment.author.id}
        richTextHandlers={{
          resolveResourceLinks: null,
          mentionedPersonLookup: async () => null,
          taskList: { canEdit: false },
          onCommentTaskItemChange: enabled ? onCommentTaskItemChange : null,
        }}
        formattedTimePreferences={defaultFormattedTimePreferences}
      />
    </MemoryRouter>,
  );

  const checkbox = await screen.findByRole("checkbox", { name: "Review" });
  await user.click(checkbox);
  if (enabled) {
    await waitFor(() => expect(checkbox).toBeChecked());
    expect(onCommentTaskItemChange).toHaveBeenCalledWith(comment.id, {
      itemPath: [0, 0],
      checked: true,
      expectedContent: taskContent,
    });
  } else {
    expect(checkbox).toBeDisabled();
    expect(onCommentTaskItemChange).not.toHaveBeenCalled();
  }
});

describe("CommentItem", () => {
  it("renders backend-resolved comment links", async () => {
    const href = `${window.location.origin}/acme-0abc/projects/project-xyz`;
    const content = {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Website", marks: [{ type: "link", attrs: { href } }] }] },
      ],
    };

    const { findByRole } = render(
      <MemoryRouter>
        <CommentItem
          comment={{ ...comment, content: JSON.stringify(content) }}
          form={form}
          commentParentType="task"
          canComment={false}
          richTextHandlers={{
            resolveResourceLinks: null,
            mentionedPersonLookup: async () => null,
            taskList: { canEdit: false },
            onCommentTaskItemChange: null,
          }}
          formattedTimePreferences={defaultFormattedTimePreferences}
        />
      </MemoryRouter>,
    );
    expect(await findByRole("link", { name: "Website" })).toHaveAttribute("href", href);
  });

  it("keeps long code blocks inside shrinkable comment content", async () => {
    const { container } = render(
      <MemoryRouter>
        <CommentItem
          comment={comment}
          form={form}
          commentParentType="task"
          canComment={false}
          richTextHandlers={{
            resolveResourceLinks: null,
            mentionedPersonLookup: async () => null,
            taskList: { canEdit: false },
            onCommentTaskItemChange: null,
          }}
          formattedTimePreferences={defaultFormattedTimePreferences}
        />
      </MemoryRouter>,
    );

    const commentElement = container.querySelector(`[data-test-id="comment-${comment.id}"]`);
    const commentContent = commentElement?.children.item(1);

    expect(commentContent).toHaveClass("min-w-0");

    await waitFor(() => {
      expect(commentContent?.querySelector("pre")).toHaveTextContent(longCodeLine);
    });
  });

  it("uses flat appearance and legacy test ids for comment feeds", () => {
    const { container, getByText } = render(
      <MemoryRouter>
        <CommentItem
          comment={comment}
          form={form}
          commentParentType="project_check_in"
          canComment
          currentUserId="author-1"
          appearance="flat"
          richTextHandlers={{
            resolveResourceLinks: null,
            mentionedPersonLookup: async () => null,
            taskList: { canEdit: false },
            onCommentTaskItemChange: null,
          }}
          formattedTimePreferences={defaultFormattedTimePreferences}
        />
      </MemoryRouter>,
    );

    const commentElement = container.querySelector(`[data-test-id="comment-${comment.id}"]`);
    expect(commentElement).toHaveClass("py-3");
    expect(commentElement).not.toHaveClass("bg-surface-dimmed");
    expect(getByText("Jane Doe")).toBeInTheDocument();
    expect(getByTestId("comment-options")).toBeInTheDocument();
  });

  it("lets managers edit another person's comment", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <CommentItem
          comment={comment}
          form={form}
          commentParentType="discussion"
          canComment
          canManageComments
          currentUserId="someone-else"
          appearance="flat"
          richTextHandlers={{
            resolveResourceLinks: null,
            mentionedPersonLookup: async () => null,
            taskList: { canEdit: false },
            onCommentTaskItemChange: null,
          }}
          formattedTimePreferences={defaultFormattedTimePreferences}
        />
      </MemoryRouter>,
    );

    await user.click(getByTestId("comment-options"));

    await waitFor(() => {
      expect(getByTestId("edit-comment")).toBeInTheDocument();
      expect(getByTestId("delete-comment")).toBeInTheDocument();
    });
  });

  it("hides edit actions when commenting is disabled", () => {
    render(
      <MemoryRouter>
        <CommentItem
          comment={comment}
          form={form}
          commentParentType="discussion"
          canComment={false}
          canManageComments
          currentUserId="author-1"
          appearance="flat"
          richTextHandlers={{
            resolveResourceLinks: null,
            mentionedPersonLookup: async () => null,
            taskList: { canEdit: false },
            onCommentTaskItemChange: null,
          }}
          formattedTimePreferences={defaultFormattedTimePreferences}
        />
      </MemoryRouter>,
    );

    expect(document.querySelector('[data-test-id="edit-comment"]')).not.toBeInTheDocument();
  });
});

it("reports a rejected deletion and keeps the comment available for retry", async () => {
  const user = userEvent.setup();
  const deleteComment = jest.fn().mockRejectedValueOnce(new Error("Deletion failed")).mockResolvedValue(undefined);
  render(
    <MemoryRouter>
      <CommentItem
        comment={comment}
        form={{ ...form, deleteComment }}
        commentParentType="kpi_entry"
        canComment
        currentUserId={comment.author.id}
        appearance="flat"
        richTextHandlers={{
          mentionedPersonLookup: async () => null,
          resolveResourceLinks: null,
          taskList: { canEdit: false },
          onCommentTaskItemChange: null,
        }}
        formattedTimePreferences={defaultFormattedTimePreferences}
      />
    </MemoryRouter>,
  );
  await user.click(getByTestId("comment-options"));
  await user.click(getByTestId("delete-comment"));
  await waitFor(() => expect(showErrorToast).toHaveBeenCalled());
  expect(getByTestId(`comment-${comment.id}`)).toBeInTheDocument();
  await user.click(getByTestId("comment-options"));
  await user.click(getByTestId("delete-comment"));
  expect(deleteComment).toHaveBeenCalledTimes(2);
  expect(deleteComment).toHaveBeenLastCalledWith(comment.id);
});

it.each([true, false])("inline menus offer only the author's edit/delete actions: owner=%s", async (owner) => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <CommentItem
        comment={comment}
        form={form}
        commentParentType="inline_thread"
        canComment
        currentUserId={owner ? comment.author.id : "another-person"}
        appearance="inline"
        richTextHandlers={{
          mentionedPersonLookup: async () => null,
          resolveResourceLinks: null,
          taskList: { canEdit: false },
          onCommentTaskItemChange: null,
        }}
        formattedTimePreferences={defaultFormattedTimePreferences}
      />
    </MemoryRouter>,
  );
  if (owner) {
    await user.click(getByTestId("comment-options"));
    expect(screen.getAllByRole("menuitem")).toHaveLength(2);
    expect(getByTestId("edit-comment")).toBeInTheDocument();
    expect(getByTestId("delete-comment")).toBeInTheDocument();
  } else {
    expect(document.querySelector('[data-test-id="comment-options"]')).toBeNull();
  }
  expect(document.querySelector('[data-test-id="copy-comment-link"]')).toBeNull();
});

it("keeps an inline edit open after failure and allows retry", async () => {
  const user = userEvent.setup();
  const editComment = jest.fn().mockRejectedValueOnce(new Error("Save failed")).mockResolvedValue(true);
  render(
    <MemoryRouter>
      <CommentItem
        comment={comment}
        form={{ ...form, editComment }}
        commentParentType="inline_thread"
        canComment
        currentUserId={comment.author.id}
        appearance="inline"
        initiallyEditing
        richTextHandlers={{
          mentionedPersonLookup: async () => null,
          resolveResourceLinks: null,
          taskList: { canEdit: false },
          onCommentTaskItemChange: null,
        }}
        formattedTimePreferences={defaultFormattedTimePreferences}
      />
    </MemoryRouter>,
  );

  await waitFor(() => expect(getByTestId("post-comment")).toBeEnabled());
  await user.click(getByTestId("post-comment"));
  await waitFor(() => expect(showErrorToast).toHaveBeenCalled());
  expect(getByTestId("edit-comment-form")).toBeInTheDocument();
  expect(getByTestId("post-comment")).toBeEnabled();
  await user.click(getByTestId("post-comment"));
  await waitFor(() => expect(document.querySelector('[data-test-id="edit-comment-form"]')).toBeNull());
  expect(editComment).toHaveBeenCalledTimes(2);
});
