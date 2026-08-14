import { render, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { MemoryRouter } from "react-router";
import userEvent from "@testing-library/user-event";

import { defaultFormattedTimePreferences } from "../FormattedTime";
import { CommentItem } from "./CommentItem";
import type { CommentFormState } from "./types";

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

function getByTestId(testId: string) {
  const el = document.querySelector<HTMLElement>(`[data-test-id="${testId}"]`);
  if (!el) throw new Error(`Could not find element with data-test-id="${testId}"`);
  return el;
}

describe("CommentItem", () => {
  it("keeps long code blocks inside shrinkable comment content", async () => {
    const { container } = render(
      <MemoryRouter>
        <CommentItem
          comment={comment}
          form={form}
          commentParentType="task"
          canComment={false}
          richTextHandlers={{ mentionedPersonLookup: async () => null }}
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
          richTextHandlers={{ mentionedPersonLookup: async () => null }}
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
          richTextHandlers={{ mentionedPersonLookup: async () => null }}
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
          richTextHandlers={{ mentionedPersonLookup: async () => null }}
          formattedTimePreferences={defaultFormattedTimePreferences}
        />
      </MemoryRouter>,
    );

    expect(document.querySelector('[data-test-id="edit-comment"]')).not.toBeInTheDocument();
  });
});
