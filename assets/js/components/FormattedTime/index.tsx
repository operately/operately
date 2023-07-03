import React from "react";

import RelativeTime from "./RelativeTime";
import ShortDate from "./ShortDate";
import ShortDateWithTime from "./ShortDateWithTime";

type Format = "relative" | "short-date" | "short-date-with-time" | "time-only" | "short-date-with-weekday-relative";

interface FormattedTimeProps {
  time: string | Date;
  format: Format;
}

export default function FormattedTime(props: FormattedTimeProps): JSX.Element {
  const parsedTime = new Date(props.time);

  switch (props.format) {
    case "relative":
      return <RelativeTime time={parsedTime} />;
    case "short-date":
      return <ShortDate time={parsedTime} />;
    case "short-date-with-time":
      return <ShortDateWithTime time={parsedTime} />;
    case "time-only":
      return (
        <>
          {parsedTime
            .toLocaleTimeString("en-US", { timeStyle: "short", hour12: true })
            .replace(" AM", "am")
            .replace(" PM", "pm")}
        </>
      );
    case "short-date-with-weekday-relative":
      return <ShortDate time={parsedTime} weekday />;
    default:
      throw "Unknown format " + props.format;
  }
}
