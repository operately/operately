import React from "react";

import { useAssignmentsCount, useReviewRefreshSignal } from "@/models/assignments";

import { IconCoffee } from "turboui";
import { DivLink } from "turboui";

import { usePaths } from "@/routes/paths";
export function Review() {
  const paths = usePaths();
  const [count, refetch] = useAssignmentsCount();
  useReviewRefreshSignal(refetch);

  return (
    <DivLink
      to={paths.reviewPath()}
      className="font-semibold flex items-center gap-1 cursor-pointer group hover:bg-surface-bg-highlight px-1.5 py-0.5 rounded relative"
      testId="review-link"
    >
      <IconCoffee size={20} stroke={2} className="mb-[3px]" />
      Review
      <AssignmentsCount count={count} />
    </DivLink>
  );
}

function AssignmentsCount({ count }: { count: number }) {
  if (count === 0) return <></>;

  return (
    <div
      className="absolute -top-1 -right-3 rounded-full bg-orange-600 flex items-center justify-center text-white-1 leading-none group-hover:bg-orange-500 transition-all"
      style={{
        height: "17px",
        width: "17px",
        fontSize: "9px",
        fontWeight: "900",
      }}
      data-test-id="review-link-count"
    >
      {count}
    </div>
  );
}
