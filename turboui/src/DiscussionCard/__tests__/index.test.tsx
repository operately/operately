import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import "@testing-library/jest-dom";
import "../../i18n";

import { DiscussionCard } from "..";
import { defaultFormattedTimePreferences } from "../../utils/storybook/formattedTime";

describe("DiscussionCard", () => {
  it("renders the scheduled label and publication date", () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <DiscussionCard
          mentionedPersonLookup={() => null}
          formattedTimePreferences={defaultFormattedTimePreferences}
          discussion={{
            id: "discussion-1",
            title: "Scheduled discussion",
            author: null,
            date: new Date("2026-05-01T12:00:00Z"),
            scheduledAt: "2026-08-01T09:00:00Z",
            link: "/projects/discussions/1",
            content: JSON.stringify({ type: "doc", content: [] }),
            commentCount: 0,
            state: "scheduled",
          }}
        />
      </MemoryRouter>
    );

    expect(screen.getByText("Scheduled")).toBeInTheDocument();
    expect(screen.getByText(/Will be posted on/)).toBeInTheDocument();
  });

  it("renders a discussion without an author placeholder", () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <DiscussionCard
          mentionedPersonLookup={() => null}
          formattedTimePreferences={defaultFormattedTimePreferences}
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
