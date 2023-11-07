import * as React from "react";

import Avatar from "@/components/Avatar";
import * as People from "@/models/people";

export function Feed({ project }) {
  return (
    <div className="w-full">
      <FeedItem person={project.champion} time="11:20am" side="left">
        <FeedItemTitle>{People.shortName(project.champion)} created this project</FeedItemTitle>

        <FeedItemContent>Assigned themselves as the champion and added a few tasks to get started.</FeedItemContent>
      </FeedItem>

      <FeedItem person={project.champion} time="8:11am" side="left">
        <FeedItemTitle>
          {People.shortName(project.champion)} commented on:{" "}
          <span className="text-blue-400 underline underline-offset-2 font-medium">Check-In From Nov 3rd</span>
        </FeedItemTitle>

        <FeedItemContent>
          Sounds good! I can't wait to see the progress. What about the thing we talked about last week? Quick reminder:
          I need to get that done by the end of the month.
        </FeedItemContent>
      </FeedItem>
    </div>
  );
}

function FeedItem({ person, time, side, children }) {
  return (
    <div className="flex w-full">
      <div className="w-full pr-2 py-3">
        <div className="flex items-start gap-3">
          {side === "left" && <Avatar person={person} size="small" />}
          {side === "left" && <div className="flex-1">{children}</div>}
          {side === "left" && <div className="shrink-0 text-xs text-white-2 mt-2 w-12 text-right">{time}</div>}
        </div>
      </div>
    </div>
  );
}

function FeedItemTitle({ children }) {
  return <div className="text-sm w-full font-bold text-white-1">{children}</div>;
}

function FeedItemContent({ children }) {
  return <div className="text-sm w-full mt-1">{children}</div>;
}
