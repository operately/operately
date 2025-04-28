import * as Time from "../utils/time";
import { findOrdinalNumberSuffix } from "../utils/numbers";

export default function LongDate({ time }: { time: Date }) {
  const options = {
    day: "numeric",
    month: "long",
  } as Intl.DateTimeFormatOptions;

  const formattedDate = time.toLocaleDateString("en-US", options);
  const day = time.getDate();
  const suffix = findOrdinalNumberSuffix(day);

  return (
    <>
      {formattedDate}
      {suffix}
      {Time.isCurrentYear(time) ? "" : ", " + time.getFullYear()}
    </>
  );
}
