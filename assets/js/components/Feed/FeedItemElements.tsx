import * as React from "react";

import Avatar from "@/components/Avatar";
import FormattedTime from "@/components/FormattedTime";

export function Container({ person, time, children }) {
  return (
    <div className="flex w-full">
      <div className="w-full pr-2 py-3">
        <div className="flex items-start gap-3">
          <Avatar person={person} size="small" />
          <div className="flex-1">{children}</div>
          <FeedItemTime time={time} />
        </div>
      </div>
    </div>
  );
}

function Time({ time }) {
  return (
    <div className="shrink-0 text-xs text-white-2 mt-2 w-12 text-right">
      <FormattedTime time={time} format="time-only" />
    </div>
  );
}

export function Title({ children }) {
  return <div className="text-sm w-full font-bold text-white-1">{children}</div>;
}

export function Content({ children }) {
  return <div className="text-sm w-full mt-1">{children}</div>;
}
