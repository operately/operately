import React from "react";

import RelativeTime from "./RelativeTime";
import ShortDate from "./ShortDate";
import ShortDateWithTime from "./ShortDateWithTime";

type Format = "relative" | "short-date" | "short-date-with-time";

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
    default:
      throw "Unknown format " + props.format;
  }
}
