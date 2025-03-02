import * as React from "react";

import { Section } from "./Section";
import { DimmedLink } from "@/components/Link";
import { IconAdjustmentsDown, IconAlignJustified } from "@tabler/icons-react";

export function Overview() {
  return (
    <Section title="Overview" icon={<IconAlignJustified size={14} />}>
      Our strategic goal is to thoughtfully expand our market presence by following clear customer demand signals and
      maintaining our commitment to product excellence.
      <br />
      <br />
      This targeted approach prioritizes sustainable growth over rapid expansion. Primary expansion criteria will focus
      on markets where we have substantial inbound customer interest...
      <div className="mt-2" />
      <div className="text-sm">
        <DimmedLink to="">Expand</DimmedLink>
      </div>
    </Section>
  );
}
