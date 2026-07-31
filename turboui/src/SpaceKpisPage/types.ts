//
// Shared types for the Space KPIs proof-of-concept.
//
// This mirrors the backend bounded context `Operately.Kpis` described in the POC:
//   - Kpi:      company_id + group_id scoped, name, unit, cadence, champion, creator
//   - KpiEntry: append-only value samples (value + recorded_at + recorded_by)
//
// Intentionally simpler than Goals/Targets: raw value + unit only, no
// target/threshold fields.
//
import type { Navigation } from "../Page/Navigation";

export namespace SpaceKpisPage {
  // Ecto.Enum :weekly | :monthly on the backend.
  export type Cadence = "weekly" | "monthly";

  export interface Person {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    title?: string;
    profileLink?: string;
  }

  export interface Space {
    id: string;
    name: string;
    link: string;
  }

  // Append-only sample of a KPI's value at a point in time.
  export interface KpiEntry {
    id: string;
    value: number;
    recordedAt: Date;
    recordedBy: Person | null;
  }

  export interface Kpi {
    id: string;
    name: string;
    unit: string;
    cadence: Cadence;
    champion: Person | null;
    insertedAt: Date;

    // Entries ordered oldest -> newest, ready for charting.
    entries: KpiEntry[];
  }

  // Payload for the `createKpi` mutation / `KpiCreating` operation.
  export interface NewKpiInput {
    name: string;
    unit: string;
    cadence: Cadence;
    championId: string | null;
  }

  // Payload for the `updateKpi` mutation / `KpiUpdating` operation. Same shape
  // as NewKpiInput plus the id of the KPI being edited. Entries are never edited
  // here — they are append-only samples managed via recordKpiEntry.
  export interface EditKpiInput {
    id: string;
    name: string;
    unit: string;
    cadence: Cadence;
    championId: string | null;
  }

  // Payload for the `logKpiEntry` mutation / `KpiEntryLogging` operation.
  // `period` is the day the value is recorded for, formatted as `YYYY-MM-DD`
  // to match the backend `:date` input.
  export interface RecordEntryInput {
    kpiId: string;
    value: number;
    period: string;
  }

  export type MutationResult = { success: boolean; id?: string; error?: string };

  export interface Props {
    space: Space;

    // Breadcrumb items shown in the page header, matching the other space tools
    // (Work Map, Tasks). Typically a single crumb linking back to the space.
    navigation: Navigation.Item[];

    kpis: Kpi[];
    currentUser: Person | null;

    // Search backing the champion picker in the "New KPI" form.
    championSearch: (query: string) => Promise<Person[]>;

    // Optional lazy-loader for a single KPI's full record (including its
    // entries) used by the detail view. The list endpoint omits entries for
    // performance, so the page fetches them on demand when a KPI is opened.
    // When omitted (e.g. stories with fully-populated mock data), the KPI from
    // `kpis` is used as-is.
    onLoadKpi?: (kpiId: string) => Promise<Kpi | null>;

    // Callbacks that stand in for the GraphQL mutations. Resolvers call the
    // Operately.Operations.{KpiCreating,KpiUpdating,KpiDeleting,KpiEntryRecording}
    // operations; presentational components never touch Ecto/GraphQL directly
    // (see models/gql convention).
    onCreateKpi: (input: NewKpiInput) => Promise<MutationResult>;
    onEditKpi: (input: EditKpiInput) => Promise<MutationResult>;
    onDeleteKpi: (kpiId: string) => Promise<MutationResult>;
    onRecordEntry: (input: RecordEntryInput) => Promise<MutationResult>;

    // Route-loader driven data states.
    loading?: boolean;
    error?: string | null;

    // In the POC any space member can read & write, so this defaults to true.
    canManage?: boolean;

    // Optional: pre-select a KPI to open straight into the detail view (used by stories).
    initialSelectedKpiId?: string | null;
  }
}
