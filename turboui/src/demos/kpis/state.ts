import { assertPresent } from "../../utils/assertions";
import type { SpaceKpisPage as KPI } from "../../SpaceKpisPage/types";
import type { KpiDemoState } from "./types";

/** Fixtures are plain data, but JSON cloning would turn their Dates into strings. */
export function cloneData<T>(value: T): T {
  if (value instanceof Date) return new Date(value) as T;
  if (Array.isArray(value)) return value.map(cloneData) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cloneData(item)])) as T;
  }
  return value;
}

export function normalizeState(state: KpiDemoState): KpiDemoState {
  return {
    ...state,
    kpis: state.kpis.map((kpi) => {
      const entries = kpi.entries
        .map((entry) => ({ ...entry, commentsCount: state.comments[entry.id]?.length ?? 0 }))
        .sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime());
      return {
        ...kpi,
        entries,
        latestEntry: entries.at(-1) ?? null,
        annotations: [...kpi.annotations].sort((a, b) => a.date.getTime() - b.date.getTime()),
      };
    }),
  };
}

export function changeKpi(state: KpiDemoState, id: string, update: (kpi: KPI.Kpi) => KPI.Kpi): KpiDemoState {
  if (!state.kpis.some((kpi) => kpi.id === id)) throw new Error("KPI not found.");
  return { ...state, kpis: state.kpis.map((kpi) => (kpi.id === id ? update(kpi) : kpi)) };
}

export function entryKpi(state: KpiDemoState, entryId: string): KPI.Kpi {
  const kpi = state.kpis.find((kpi) => kpi.entries.some((entry) => entry.id === entryId));
  assertPresent(kpi, "Recorded value not found.");
  return kpi;
}

export function annotationKpi(state: KpiDemoState, id: string): KPI.Kpi {
  const kpi = state.kpis.find((kpi) => kpi.annotations.some((annotation) => annotation.id === id));
  assertPresent(kpi, "Annotation not found.");
  return kpi;
}

export function withoutKeys<T>(values: Record<string, T>, keys: string[]): Record<string, T> {
  const removed = new Set(keys);
  return Object.fromEntries(Object.entries(values).filter(([id]) => !removed.has(id)));
}

export function recordedDate(period: string): Date {
  const date = new Date(`${period}T12:00:00`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(period) || Number.isNaN(date.getTime())) throw new Error("Invalid recorded date.");
  const [year, month, day] = period.split("-").map(Number);
  if (date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day)
    throw new Error("Invalid recorded date.");
  return date;
}
