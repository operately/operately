import React from "react";

import { IconChartColumn } from "turboui";

import { Space } from "@/models/spaces";
import { usePaths } from "@/routes/paths";
import { Container } from "./components";

interface Props {
  space: Space;
}

// Space tool card linking to the KPIs page. Only rendered when the company has
// the `space_kpis` experimental feature enabled (see ToolsSection).
export function Kpis({ space }: Props) {
  const paths = usePaths();
  const path = paths.spaceKpisPath(space.id!);

  return (
    <Container path={path} testId="kpis-tool">
      <div className="flex flex-col items-center justify-center h-full px-6 text-center group">
        <IconChartColumn size={40} className="text-content-dimmed mb-3" />
        <div className="text-base font-bold">KPIs</div>
        <div className="mt-1 text-sm text-content-dimmed">
          Track the numbers this space cares about and log updates on a weekly or monthly cadence.
        </div>
      </div>
    </Container>
  );
}
