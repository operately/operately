import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";
import userEvent from "@testing-library/user-event";

import { defaultFormattedTimePreferences } from "../FormattedTime";
import { createMockRichEditorHandlers } from "../utils/storybook/richEditor";
import { asRichText } from "../utils/storybook/richContent";
import { TemplateDiscussionPage } from ".";
import type { TemplateDiscussionPage as Types } from ".";
import type { CommentSectionProps } from "../CommentSection";

function renderPage(overrides: Partial<Types.Props> = {}) {
  const props: Types.Props = {
    pageTitle: ["Release plan", "Launch template"],
    navigation: [
      { to: "/spaces/product", label: "Product" },
      { to: "/templates", label: "Project Templates" },
    ],
    discussion: {
      title: "Release plan",
      body: asRichText("Coordinate the launch."),
      author: null,
      insertedAt: new Date("2026-08-11T12:00:00Z"),
    },
    richTextHandlers: createMockRichEditorHandlers(),
    formattedTimePreferences: defaultFormattedTimePreferences,
    ...overrides,
  };

  return render(
    <MemoryRouter>
      <TemplateDiscussionPage {...props} />
    </MemoryRouter>,
  );
}

describe("TemplateDiscussionPage", () => {
  it("places Edit discussion in the page options menu", async () => {
    const { container } = renderPage({ editLink: "/templates/template-1/discussions/discussion-1/edit" });
    const user = userEvent.setup();

    expect(screen.queryByText("Edit discussion")).not.toBeInTheDocument();

    await user.click(container.querySelector('[data-test-id="options-button"]')!);

    await waitFor(() => {
      expect(document.querySelector('[data-test-id="edit-template-discussion"]')).toHaveAttribute(
        "href",
        "/templates/template-1/discussions/discussion-1/edit",
      );
    });
  });

  it("hides the options menu when the discussion is read-only", () => {
    const { container } = renderPage();

    expect(container.querySelector('[data-test-id="options-button"]')).not.toBeInTheDocument();
  });

  it("renders comments when provided", () => {
    const comments: CommentSectionProps = {
      items: [
        {
          type: "comment",
          value: {
            id: "comment-1",
            content: JSON.stringify({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Note" }] }] }),
            author: { id: "author-1", fullName: "Ada Lovelace", avatarUrl: null, profileLink: "" },
            insertedAt: "2026-08-11T12:00:00Z",
            reactions: [],
          },
        },
      ],
      currentUser: { id: "user-1", fullName: "Current User", avatarUrl: null, profileLink: "" },
      canComment: true,
      onAddComment: jest.fn(),
      onEditComment: jest.fn(),
      richTextHandlers: createMockRichEditorHandlers(),
      formattedTimePreferences: defaultFormattedTimePreferences,
    };

    renderPage({ comments });

    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("Note")).toBeInTheDocument();
  });
});
