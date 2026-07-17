import { render, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { MemoryRouter } from "react-router";

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
};

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
});
