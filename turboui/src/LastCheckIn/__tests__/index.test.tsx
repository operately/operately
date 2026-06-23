import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";

import { LastCheckIn } from "..";
import { defaultFormattedTimePreferences } from "../../utils/storybook/formattedTime";

describe("LastCheckIn", () => {
  function renderCheckIn(author = null) {
    return render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <LastCheckIn
          mentionedPersonLookup={() => null}
          formattedTimePreferences={defaultFormattedTimePreferences}
          checkIns={[
            {
              id: "1",
              link: "/goals/check-ins/1",
              author,
              date: new Date("2026-05-01T12:00:00Z"),
              content: JSON.stringify({ type: "doc", content: [] }),
              commentCount: 2,
              status: "on_track",
            },
          ]}
        />
      </MemoryRouter>
    );
  }

  it("renders a check-in without an author placeholder", () => {
    renderCheckIn(null);

    expect(screen.getByText("May 1")).toBeInTheDocument();
    expect(screen.queryByTitle("?")).not.toBeInTheDocument();
  });
});
