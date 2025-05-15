import React from "react";

interface Props {
  time: Date;
}

export default function TimeOnly({ time }: Props) {
  return (
    <>
      {time.toLocaleTimeString("en-US", { timeStyle: "short", hour12: true }).replace(" AM", "am").replace(" PM", "pm")}
    </>
  );
}
