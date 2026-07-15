import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { CheckInMetadata, CheckInTitle } from ".";
import { defaultFormattedTimePreferences } from "../FormattedTime";

const formattedTimePreferences = {
  ...defaultFormattedTimePreferences,
  timezone: "UTC",
  timeFormat: "hour_24" as const,
};

const author = {
  id: "person-1",
  fullName: "Ada Lovelace",
  avatarUrl: null,
};

describe("CheckInTitle", () => {
  it("renders an h1 with the shared wording, responsive size, and draft status", () => {
    render(
      <CheckInTitle
        state="draft"
        timestamp="2025-07-13T12:00:00Z"
        formattedTimePreferences={formattedTimePreferences}
      />,
    );

    const title = screen.getByRole("heading", { name: "Check-In for July 13th, 2025 Draft" });

    expect(title.tagName).toBe("H1");
    expect(title).toHaveClass("text-xl", "sm:text-3xl");
  });

  it("renders the shared wording and scheduled status", () => {
    render(
      <CheckInTitle
        state="scheduled"
        timestamp="2025-07-13T12:00:00Z"
        formattedTimePreferences={formattedTimePreferences}
      />,
    );

    expect(screen.getByRole("heading", { name: "Check-In for July 13th, 2025 Scheduled" })).toBeInTheDocument();
    expect(screen.getByText("Scheduled")).toBeInTheDocument();
  });

  it("uses the posting instant when the configured timezone changes the calendar date", () => {
    const postingTime = "2025-07-13T23:44:00Z";
    const aucklandPreferences = {
      ...formattedTimePreferences,
      timezone: "Pacific/Auckland",
    };

    render(
      <>
        <CheckInTitle state="published" timestamp={postingTime} formattedTimePreferences={aucklandPreferences} />
        <CheckInMetadata
          resourceType="goal"
          author={author}
          state="published"
          postedAt={postingTime}
          formattedTimePreferences={aucklandPreferences}
        />
      </>,
    );

    expect(screen.getByRole("heading", { name: "Check-In for July 14th, 2025" })).toBeInTheDocument();
    expect(screen.getByText("Posted July 14th, 2025 at 11:44")).toHaveClass("sr-only");
  });
});

describe("CheckInMetadata", () => {
  it("renders published goal check-in metadata with text separators", () => {
    render(
      <CheckInMetadata
        resourceType="goal"
        author={author}
        state="published"
        postedAt="2025-07-13T18:42:00Z"
        formattedTimePreferences={formattedTimePreferences}
      />,
    );

    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("18:42")).toBeInTheDocument();
    expect(screen.getByText("Not yet acknowledged")).toBeInTheDocument();
    expect(screen.getAllByText("·")).toHaveLength(2);
  });

  it("renders published project check-in metadata with text separators", () => {
    render(
      <CheckInMetadata
        resourceType="project"
        author={author}
        state="published"
        postedAt="2025-07-13T18:42:00Z"
        acknowledgedBy={{ fullName: "Grace Hopper" }}
        formattedTimePreferences={formattedTimePreferences}
      />,
    );

    expect(screen.getByText("Acknowledged by")).toBeInTheDocument();
    expect(screen.getByText("Grace Hopper")).toBeInTheDocument();
    expect(screen.getAllByText("·")).toHaveLength(2);
  });

  it("omits a missing author without leaving a leading separator", () => {
    render(
      <CheckInMetadata
        resourceType="goal"
        author={null}
        state="published"
        postedAt="2025-07-13T18:42:00Z"
        formattedTimePreferences={formattedTimePreferences}
      />,
    );

    expect(screen.queryByText("Ada Lovelace")).not.toBeInTheDocument();
    expect(screen.getByText("18:42")).toBeInTheDocument();
    expect(screen.getByText("Not yet acknowledged")).toBeInTheDocument();
    expect(screen.getAllByText("·")).toHaveLength(1);
  });

  it("renders the scheduled posting date instead of published metadata", () => {
    render(
      <CheckInMetadata
        resourceType="goal"
        author={author}
        state="scheduled"
        postedAt="2025-07-13T18:42:00Z"
        scheduledAt="2025-07-14T09:00:00Z"
        formattedTimePreferences={formattedTimePreferences}
      />,
    );

    expect(screen.getByText(/Will be posted on July 14th, 2025 at 09:00/)).toBeInTheDocument();
    expect(screen.queryByText("Not yet acknowledged")).not.toBeInTheDocument();
  });

  it("uses the scheduled posting instant when the configured timezone changes the calendar date", () => {
    render(
      <CheckInMetadata
        resourceType="goal"
        author={author}
        state="scheduled"
        postedAt="2025-07-13T23:44:00Z"
        scheduledAt="2025-07-13T23:44:00Z"
        formattedTimePreferences={{
          ...formattedTimePreferences,
          timezone: "Pacific/Auckland",
        }}
      />,
    );

    expect(screen.getByText(/Will be posted on July 14th, 2025 at 11:44/)).toBeInTheDocument();
  });
});
