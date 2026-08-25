import React from "react";

import type { SpaceKpisPage } from "./types";

interface Values {
  name: string;
  unit: string;
  cadence: SpaceKpisPage.Cadence;
  champion: SpaceKpisPage.Person | null;
}

export interface KpiFields extends Values {
  update: (changes: Partial<Values>) => Promise<void>;
}

function valuesOf(kpi: SpaceKpisPage.Kpi): Values {
  return { name: kpi.name, unit: kpi.unit, cadence: kpi.cadence, champion: kpi.champion };
}

// A KPI's editable fields are spread across its page: the name is the page
// title, the unit, cadence and champion are in the sidebar. The update mutation
// takes all of them at once, so they share one copy of the values here instead
// of each field building a payload from props that a neighbouring edit may have
// already made stale. Edits show immediately and roll back if the mutation
// fails. Returns null while no KPI is open, so the list view can call this too.
export function useKpiFields(
  kpi: SpaceKpisPage.Kpi | null,
  onEditKpi: (input: SpaceKpisPage.EditKpiInput) => Promise<SpaceKpisPage.MutationResult>,
): KpiFields | null {
  const [values, setValues] = React.useState<Values | null>(() => (kpi ? valuesOf(kpi) : null));

  React.useEffect(() => {
    setValues(kpi ? valuesOf(kpi) : null);
  }, [kpi?.id, kpi?.name, kpi?.unit, kpi?.cadence, kpi?.champion]);

  if (!kpi || !values) return null;

  const update = async (changes: Partial<Values>) => {
    const previous = values;
    const next = { ...values, ...changes };
    setValues(next);

    const result = await onEditKpi({
      id: kpi.id,
      name: next.name,
      unit: next.unit,
      cadence: next.cadence,
      championId: next.champion?.id ?? null,
    });

    if (!result.success) setValues(previous);
  };

  return { ...values, update };
}
