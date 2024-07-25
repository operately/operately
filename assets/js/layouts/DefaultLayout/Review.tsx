import React from "react";

import { useAssignmentsCount } from "@/models/assignments";

import { DivLink } from "@/components/Link";
import { Paths } from "@/routes/paths";
import { IconCoffee } from "@tabler/icons-react";


export function Review() {
  const count = useAssignmentsCount();

  return (
    <DivLink
      to={Paths.reviewPath()}
      className="font-semibold flex items-center gap-1 cursor-pointer group hover:bg-base-accent px-1.5 py-0.5 rounded relative"
      data-test-id="review-link"
    >
      <IconCoffee
        size={20}
        stroke={2}
        className="mb-[3px]"
      />
      Review
      <AssignmentsCount count={count} />
    </DivLink>
  );
}


function AssignmentsCount({ count }: { count: number }) {
  if (count === 0) return <></>;

  return (
    <div
      className="absolute -top-1 -right-3 rounded-full bg-orange-600 flex items-center justify-center text-content-accent leading-none group-hover:bg-orange-500 transition-all"
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
