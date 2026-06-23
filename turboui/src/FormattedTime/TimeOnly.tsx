import React from "react";

import { formatTime, type TimeFormat } from "../utils/formatting";

interface TimeOnlyProps {
  time: Date;
  locale: string;
  timeFormat: TimeFormat;
}

export default function TimeOnly({ time, locale, timeFormat }: TimeOnlyProps): JSX.Element {
  return <>{formatTime(time, locale, timeFormat)}</>;
}
