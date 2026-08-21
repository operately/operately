import React from "react";

import { DivLink } from "../Link";
import { IconCoffee } from "../icons";
import { CountBadge } from "./CountBadge";

export function Review({ path, count }: { path: string; count: number }) {
  return (
    <DivLink
      to={path}
      className="font-semibold flex items-center gap-1 cursor-pointer group hover:bg-surface-bg-highlight px-1.5 py-0.5 rounded relative"
      testId="review-link"
    >
      <IconCoffee size={20} stroke={2} className="mb-[3px]" />
      Review
      <CountBadge count={count} rightOffset={3} testId="review-link-count" />
    </DivLink>
  );
}
