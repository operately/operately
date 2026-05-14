import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";

import { DiscussionCard } from "..";

describe("DiscussionCard", () => {
  it("renders a discussion without an author placeholder", () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <DiscussionCard
          mentionedPersonLookup={() => null}
          discussion={{
            id: "discussion-1",
            title: "Imported discussion",
            author: null,
            date: new Date("2026-05-01T12:00:00Z"),
            link: "/projects/discussions/1",
            content: JSON.stringify({ type: "doc", content: [] }),
            commentCount: 4,
          }}
        />
      </MemoryRouter>
    );

    expect(screen.getByText("Imported discussion")).toBeInTheDocument();
    expect(screen.queryByTitle("?")).not.toBeInTheDocument();
  });
});
