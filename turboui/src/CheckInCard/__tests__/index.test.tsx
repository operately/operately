import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import "@testing-library/jest-dom";
import "../../i18n";

import { CheckInCard } from "..";
import { defaultFormattedTimePreferences } from "../../utils/storybook/formattedTime";

describe("CheckInCard", () => {
  type Props = React.ComponentProps<typeof CheckInCard>;

  function renderCard(checkIn: Partial<Props["checkIn"]> = {}, type: Props["type"] = "goal") {
    return render(
      <MemoryRouter>
        <CheckInCard
          type={type}
          mentionedPersonLookup={async () => null}
          formattedTimePreferences={defaultFormattedTimePreferences}
          checkIn={{
            link: "/goals/check-ins/1",
            author: null,
            date: new Date("2026-05-01T12:00:00Z"),
            content: JSON.stringify({ type: "doc", content: [] }),
            commentCount: 3,
            status: "on_track",
            state: "published",
            ...checkIn,
          }}
        />
      </MemoryRouter>,
    );
  }

  it("renders a check-in without an author placeholder", () => {
    renderCard();

    expect(screen.getByText(/Check-In for/)).toBeInTheDocument();
    expect(screen.queryByTitle("?")).not.toBeInTheDocument();
  });

  it("renders the scheduled label and publication date", () => {
    renderCard({ state: "scheduled", scheduledAt: "2026-05-10T12:00:00Z" });

    expect(screen.getByText("Scheduled")).toBeInTheDocument();
    expect(screen.getByText(/Will be posted on/)).toBeInTheDocument();
  });

  describe.each(["project", "goal"] as const)("%s acknowledgement", (type) => {
    it("marks published check-ins awaiting acknowledgement", () => {
      renderCard({ acknowledgedAt: null }, type);

      expect(screen.getByText("Not yet acknowledged")).toBeInTheDocument();
    });

    it("does not mark acknowledged check-ins as pending", () => {
      renderCard({ acknowledgedAt: "2026-05-02T12:00:00Z" }, type);

      expect(screen.queryByText("Not yet acknowledged")).not.toBeInTheDocument();
    });

    it.each(["draft", "scheduled"] as const)("does not request acknowledgement for %s check-ins", (state) => {
      renderCard({ state, acknowledgedAt: null }, type);

      expect(screen.queryByText("Not yet acknowledged")).not.toBeInTheDocument();
    });

    it("does not infer pending acknowledgement when the timestamp was not provided", () => {
      renderCard({}, type);

      expect(screen.queryByText("Not yet acknowledged")).not.toBeInTheDocument();
    });
  });
});
