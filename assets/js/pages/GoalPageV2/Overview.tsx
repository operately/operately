import * as React from "react";

import { Section } from "./Section";
import { DimmedLink } from "@/components/Link";

export function Overview() {
  return (
    <Section title="Overview">
      Our strategic goal is to thoughtfully expand our market presence by following clear customer demand signals and
      maintaining our commitment to product excellence. This targeted approach prioritizes sustainable growth over rapid
      expansion. Primary expansion criteria will focus on markets where we have substantial inbound customer interest
      and clear evidence of product-market fit. This demand-driven...
      <div className="mt-2" />
      <DimmedLink to="">Expand</DimmedLink>
    </Section>
  );
}
