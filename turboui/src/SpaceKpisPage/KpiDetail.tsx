import React from "react";

import { Avatar } from "../Avatar";
import { Menu, MenuActionItem } from "../Menu";
import { PersonField } from "../PersonField";
import { SidebarSection } from "../SidebarSection";
import { KpiLineChart } from "./KpiLineChart";
import { TrendIndicator } from "./TrendIndicator";
import type { SpaceKpisPage } from "./types";
import { CADENCE_OPTIONS, formatCadence, formatShortDate, formatValue, latestEntry, latestTrend } from "./utils";

interface KpiDetailProps {
  kpi: SpaceKpisPage.Kpi;
  canManage: boolean;
  championSearch: (query: string) => Promise<SpaceKpisPage.Person[]>;
  onEditKpi: (input: SpaceKpisPage.EditKpiInput) => Promise<SpaceKpisPage.MutationResult>;
}

// The KPI name, back navigation and the "Log update" action live in the shared
// page header (see index.tsx), so the detail body focuses on the latest value,
// history chart, recorded-updates log, and supporting information sidebar.
export function KpiDetail({ kpi, canManage, championSearch, onEditKpi }: KpiDetailProps) {
  const latest = latestEntry(kpi);
  const trend = latestTrend(kpi);

  return (
    <div className="sm:grid sm:grid-cols-12 sm:gap-8" data-test-id="kpi-detail">
      <div className="sm:col-span-8">
        <div className="flex items-end gap-3">
          <div className="text-4xl font-bold text-content-accent">
            {latest ? formatValue(latest.value, kpi.unit) : "—"}
          </div>
          <div className="pb-1">
            <TrendIndicator delta={trend} />
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-stroke-base bg-surface-base p-4">
          <h2 className="mb-3 text-sm font-bold text-content-accent">History</h2>
          <KpiLineChart entries={kpi.entries} unit={kpi.unit} />
        </div>

        <EntriesTable entries={kpi.entries} unit={kpi.unit} />
      </div>

      <KpiSidebar kpi={kpi} canManage={canManage} championSearch={championSearch} onEditKpi={onEditKpi} />
    </div>
  );
}

function KpiSidebar({
  kpi,
  canManage,
  championSearch,
  onEditKpi,
}: {
  kpi: SpaceKpisPage.Kpi;
  canManage: boolean;
  championSearch: (query: string) => Promise<SpaceKpisPage.Person[]>;
  onEditKpi: (input: SpaceKpisPage.EditKpiInput) => Promise<SpaceKpisPage.MutationResult>;
}) {
  const [champion, setChampion] = React.useState(kpi.champion);
  const [cadence, setCadence] = React.useState(kpi.cadence);
  const searchData = useChampionSearch(championSearch);

  React.useEffect(() => {
    setChampion(kpi.champion);
    setCadence(kpi.cadence);
  }, [kpi.champion, kpi.cadence]);

  const save = async (nextChampion: SpaceKpisPage.Person | null, nextCadence: SpaceKpisPage.Cadence) => {
    const previous = { champion, cadence };
    setChampion(nextChampion);
    setCadence(nextCadence);

    const result = await onEditKpi({
      id: kpi.id,
      name: kpi.name,
      unit: kpi.unit,
      cadence: nextCadence,
      championId: nextChampion?.id ?? null,
    });

    if (!result.success) {
      setChampion(previous.champion);
      setCadence(previous.cadence);
    }
  };

  return (
    <aside className="mt-8 space-y-6 sm:col-span-4 sm:mt-0 sm:pl-8" data-test-id="kpi-sidebar">
      <LastUpdate kpi={kpi} canManage={canManage} />

      <SidebarSection title="Champion">
        {canManage ? (
          <PersonField
            person={champion}
            setPerson={(person) => save(person, cadence)}
            searchData={searchData}
            emptyStateMessage="Set champion"
            emptyStateReadOnlyMessage="No champion"
            testId="kpi-champion"
          />
        ) : (
          <PersonField person={champion} readonly emptyStateReadOnlyMessage="No champion" testId="kpi-champion" />
        )}
      </SidebarSection>

      <SidebarSection title="Cadence">
        <CadenceField cadence={cadence} readonly={!canManage} onChange={(next) => save(champion, next)} />
      </SidebarSection>
    </aside>
  );
}

// The most recent entry, presented like a project's last check-in: what was
// recorded, when, and by whom. The trend stays with the headline value in the
// main column so the change is not stated twice.
function LastUpdate({ kpi, canManage }: { kpi: SpaceKpisPage.Kpi; canManage: boolean }) {
  const latest = latestEntry(kpi);

  if (!latest) {
    return (
      <SidebarSection title="Last update">
        <p className="text-sm text-content-dimmed" data-test-id="kpi-last-update-empty">
          {canManage
            ? "No updates yet. Log the first value to start tracking."
            : "No updates yet. Values appear here as they are logged."}
        </p>
      </SidebarSection>
    );
  }

  return (
    <SidebarSection title="Last update">
      <div
        className="flex flex-col gap-1 border-l-4 border-surface-outline bg-zinc-50 py-3 pl-3 pr-4 text-sm dark:bg-zinc-800"
        data-test-id="kpi-last-update"
      >
        <div className="font-semibold">{formatShortDate(latest.recordedAt)}</div>
        <div className="text-lg font-bold text-content-accent">{formatValue(latest.value, kpi.unit)}</div>

        {latest.recordedBy && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <Avatar person={latest.recordedBy} size={20} />
            {latest.recordedBy.fullName.split(" ")[0]}
          </div>
        )}
      </div>
    </SidebarSection>
  );
}

// PersonField debounces keystrokes but still lets requests overlap, so a slower
// earlier search could otherwise land last and offer people who don't match what
// was typed. Keep only the newest request's results, and show none when a search
// fails rather than leaving names from a previous query on screen.
function useChampionSearch(search: (query: string) => Promise<SpaceKpisPage.Person[]>): PersonField.SearchData {
  const [people, setPeople] = React.useState<SpaceKpisPage.Person[]>([]);
  const newestRequest = React.useRef(0);

  const onSearch = React.useCallback(
    async (query: string) => {
      const request = ++newestRequest.current;

      let results: SpaceKpisPage.Person[] = [];
      try {
        results = await search(query);
      } catch (error) {
        console.error(error);
      }

      if (request === newestRequest.current) setPeople(results);
    },
    [search],
  );

  return React.useMemo(() => ({ people, onSearch }), [people, onSearch]);
}

function CadenceField({
  cadence,
  readonly,
  onChange,
}: {
  cadence: SpaceKpisPage.Cadence;
  readonly: boolean;
  onChange: (cadence: SpaceKpisPage.Cadence) => void;
}) {
  const label = formatCadence(cadence);

  if (readonly) {
    return (
      <div className="text-sm text-content-base" data-test-id="kpi-cadence">
        {label}
      </div>
    );
  }

  return (
    <Menu
      testId="kpi-cadence"
      size="tiny"
      customTrigger={
        <button
          type="button"
          className="flex items-center truncate text-left text-sm font-medium text-content-base focus:outline-none focus:ring-2 focus:ring-primary-base hover:bg-surface-dimmed px-1.5 py-1 -my-1 -mx-1.5 rounded cursor-pointer"
        >
          {label}
        </button>
      }
    >
      {CADENCE_OPTIONS.map((option) => (
        <MenuActionItem
          key={option.value}
          onClick={() => {
            if (option.value !== cadence) onChange(option.value);
          }}
          testId={`kpi-cadence-${option.value}`}
        >
          {option.label}
        </MenuActionItem>
      ))}
    </Menu>
  );
}

function EntriesTable({ entries, unit }: { entries: SpaceKpisPage.KpiEntry[]; unit: string }) {
  if (entries.length === 0) return null;

  // Show newest first in the log, even though entries are stored oldest -> newest.
  const rows = [...entries].reverse();

  return (
    <div className="mt-6">
      <h2 className="mb-3 text-sm font-bold text-content-accent">Recorded updates</h2>
      <div className="overflow-hidden rounded-lg border border-stroke-base">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stroke-base bg-surface-dimmed text-left text-xs uppercase tracking-wide text-content-dimmed">
              <th className="px-4 py-2 font-medium">Date</th>
              <th className="px-4 py-2 font-medium">Recorded by</th>
              <th className="px-4 py-2 text-right font-medium">Value</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((entry) => (
              <tr
                key={entry.id}
                className="border-b border-stroke-dimmed last:border-b-0"
                data-test-id={`entry-row-${entry.id}`}
              >
                <td className="px-4 py-2 text-content-base">{formatShortDate(entry.recordedAt)}</td>
                <td className="px-4 py-2">
                  {entry.recordedBy ? (
                    <div className="flex items-center gap-2">
                      <Avatar person={entry.recordedBy} size="tiny" />
                      <span className="text-content-base">{entry.recordedBy.fullName}</span>
                    </div>
                  ) : (
                    <span className="text-content-subtle">Unknown</span>
                  )}
                </td>
                <td className="px-4 py-2 text-right font-medium text-content-accent">
                  {formatValue(entry.value, unit)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
