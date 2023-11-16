import React from "react";

import * as Time from "@/utils/time";

export default function Duration({ start, end }: { start: Date; end: Date }) {
  return <span>{Time.humanDuration(start, end)}</span>;
}
