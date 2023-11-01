import React from "react";

import * as Time from "@/utils/time";

export default function Duration({ start, end }) {
  const days = Time.daysBetween(start, end);

  if (days === 1) {
    return <span>1 day</span>;
  }

  if (days < 7) {
    return <span>{days} days</span>;
  }

  if (days < 30) {
    return <span>{Math.floor(days / 7)} weeks</span>;
  }

  if (days < 365) {
    return <span>{Math.floor(days / 30)} months</span>;
  }

  return <span>{Math.floor(days / 365)} years</span>;
}
