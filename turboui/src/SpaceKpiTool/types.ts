/**
 * Shared types for the KPI space-tool POC.
 *
 * These mirror the backend schemas proposed in the POC brief:
 *   - `Operately.Kpis.Kpi`        -> Kpi
 *   - `Operately.Kpis.DataPoint`  -> KpiDataPoint
 *
 * They intentionally live in turboui (Storybook) only — the POC is not wired
 * into production routes. See index.stories.tsx for the reviewer notes and the
 * list of follow-up gaps (notification fan-out, permission edges, chart lib).
 */

/** Matches the `cadence` enum on the `kpis` table (weekly | monthly). */
export type KpiCadence = "weekly" | "monthly";

/** A single logged measurement, mirrors a row in `kpi_data_points`. */
export interface KpiDataPoint {
  id: string;
  /** decimal value; kept as a number in the UI layer */
  value: number;
  /** ISO date (YYYY-MM-DD) for the period this point represents (`recorded_for`) */
  recordedFor: string;
  /** display name of the person who logged it (`inserted_by_id` resolved) */
  insertedBy?: string;
}

/** A KPI definition plus its recorded data points. */
export interface Kpi {
  id: string;
  name: string;
  /** e.g. "$", "%", "users", "ms" */
  unit: string;
  cadence: KpiCadence;
  creator?: string;
  dataPoints: KpiDataPoint[];
}

/** Payload for the `create_kpi` mutation. */
export interface CreateKpiInput {
  name: string;
  unit: string;
  cadence: KpiCadence;
}

/** Payload for the `add_kpi_data_point` mutation. */
export interface AddKpiDataPointInput {
  kpiId: string;
  value: number;
  recordedFor: string;
}
