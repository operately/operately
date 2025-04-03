import * as React from "react";

interface TimeOnlyProps {
  time: Date;
}

export default function TimeOnly({ time }: TimeOnlyProps): JSX.Element {
  return (
    <>
      {time.toLocaleTimeString("en-US", { timeStyle: "short", hour12: true }).replace(" AM", "am").replace(" PM", "pm")}
    </>
  );
}
