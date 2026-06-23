import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import "../../i18n";

import { CheckInCard } from "..";
import { defaultFormattedTimePreferences } from "../../utils/storybook/formattedTime";

describe("CheckInCard", () => {
  function renderCard(author = null) {
    return render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <CheckInCard
          type="goal"
          mentionedPersonLookup={() => null}
          formattedTimePreferences={defaultFormattedTimePreferences}
          checkIn={{
            link: "/goals/check-ins/1",
            author,
            date: new Date("2026-05-01T12:00:00Z"),
            content: JSON.stringify({ type: "doc", content: [] }),
            commentCount: 3,
            status: "on_track",
          }}
        />
      </MemoryRouter>
    );
  }

  it("renders a check-in without an author placeholder", () => {
    renderCard(null);

    expect(screen.getByText(/Check-In for/)).toBeInTheDocument();
    expect(screen.queryByTitle("?")).not.toBeInTheDocument();
  });
});
