import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { DocumentTitle } from "./index";
import { defaultFormattedTimePreferences } from "../FormattedTime";

jest.mock("../Avatar", () => ({
  Avatar: ({ person }: { person: { fullName: string } }) => <span>{person.fullName}</span>,
}));

jest.mock("../BulletDot", () => ({
  BulletDot: () => <span>&bull;</span>,
}));

jest.mock("../FormattedTime", () => ({
  FormattedTime: ({ time }: { time: string }) => <time dateTime={time} />,
  defaultFormattedTimePreferences: {
    locale: "en-US",
    timezone: "UTC",
    timeFormat: "automatic",
  },
}));

jest.mock("../SchedulePosting", () => ({
  ScheduledPostLabel: () => <span>Scheduled</span>,
  ScheduledPostDate: ({ scheduledAt }: { scheduledAt: string }) => <time dateTime={scheduledAt} />,
}));

describe("DocumentTitle", () => {
  it("renders without an author", () => {
    const html = renderToStaticMarkup(
      <DocumentTitle
        title="Quarterly Company Update"
        author={null}
        state="published"
        publishedAt="2026-05-13T12:00:00Z"
        formattedTimePreferences={defaultFormattedTimePreferences}
      />,
    );

    expect(html).toContain("Quarterly Company Update");
    expect(html).toContain("Posted");
    expect(html).not.toContain('title="?"');
  });

  it("renders the modified date when it differs from the posted date", () => {
    const html = renderToStaticMarkup(
      <DocumentTitle
        title="Quarterly Company Update"
        author={null}
        state="published"
        publishedAt="2026-05-13T12:00:00Z"
        modifiedAt="2026-05-14T12:00:00Z"
        formattedTimePreferences={defaultFormattedTimePreferences}
      />,
    );

    expect(html).toContain("Edited");
  });

  it("does not render the modified date when it matches the posted date", () => {
    const html = renderToStaticMarkup(
      <DocumentTitle
        title="Quarterly Company Update"
        author={null}
        state="published"
        publishedAt="2026-05-13T12:00:00Z"
        modifiedAt="2026-05-13T12:00:00Z"
        formattedTimePreferences={defaultFormattedTimePreferences}
      />,
    );

    expect(html).not.toContain("Edited");
  });
});
