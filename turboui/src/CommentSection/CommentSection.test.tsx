import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { MemoryRouter } from "react-router";

import { defaultFormattedTimePreferences } from "../FormattedTime";
import { CommentSection } from "./CommentSection";
import type { CommentSectionItem, Person } from "./types";

const currentUser: Person = {
  id: "user-1",
  fullName: "Current User",
  avatarUrl: null,
  profileLink: "/people/current-user",
};

const author: Person = {
  id: "author-1",
  fullName: "Jane Doe",
  avatarUrl: null,
  profileLink: "/people/jane-doe",
};

const items: CommentSectionItem[] = [
  {
    type: "comment",
    value: {
      id: "comment-1",
      content: JSON.stringify({
        type: "doc",
        content: [{ type: "paragraph", content: [{ type: "text", text: "Hello" }] }],
      }),
      author,
      insertedAt: "2026-07-17T12:00:00Z",
      reactions: [],
    },
  },
  {
    type: "acknowledgment",
    value: currentUser,
    insertedAt: "2026-07-17T13:00:00Z",
  },
];

function queryByTestId(testId: string) {
  return document.querySelector<HTMLElement>(`[data-test-id="${testId}"]`);
}

describe("CommentSection", () => {
  it("renders flat comments, acknowledgment rows, and the add-comment control", () => {
    render(
      <MemoryRouter>
        <CommentSection
          items={items}
          currentUser={currentUser}
          canComment
          onAddComment={jest.fn()}
          onEditComment={jest.fn()}
          onDeleteComment={jest.fn()}
          richTextHandlers={{ mentionedPersonLookup: async () => null }}
          formattedTimePreferences={defaultFormattedTimePreferences}
          ackLabel="Check-In"
        />
      </MemoryRouter>,
    );

    expect(queryByTestId("comment-comment-1")).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText(/acknowledged this Check-In/)).toBeInTheDocument();
    expect(queryByTestId("add-comment")).toBeInTheDocument();
  });

  it("hides the composer when commenting is disabled", () => {
    render(
      <MemoryRouter>
        <CommentSection
          items={items}
          currentUser={currentUser}
          canComment={false}
          onAddComment={jest.fn()}
          onEditComment={jest.fn()}
          richTextHandlers={{ mentionedPersonLookup: async () => null }}
          formattedTimePreferences={defaultFormattedTimePreferences}
        />
      </MemoryRouter>,
    );

    expect(queryByTestId("add-comment")).not.toBeInTheDocument();
  });
});
