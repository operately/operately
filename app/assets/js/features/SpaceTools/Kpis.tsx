import React, { useMemo } from "react";

import { KpiSummaryCard } from "turboui";

import { Kpi, parseKpiForTurboUi } from "@/models/kpis";
import { Space } from "@/models/spaces";
import { usePaths } from "@/routes/paths";
import { Container } from "./components";

interface Props {
  space: Space;
  kpis?: Kpi[];
}

export function Kpis({ space, kpis = [] }: Props) {
  const paths = usePaths();
  const path = paths.spaceKpisPath(space.id!);
  const parsedKpis = useMemo(() => kpis.map((kpi) => parseKpiForTurboUi(paths, kpi)), [kpis, paths]);

  return (
    <Container path={path} testId="kpis-tool">
      <KpiSummaryCard kpis={parsedKpis} />
    </Container>
  );
}
