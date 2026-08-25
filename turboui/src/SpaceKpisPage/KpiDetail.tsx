import React from "react";

import { ActionList } from "../ActionList";
import { Avatar } from "../Avatar";
import { Menu, MenuActionItem } from "../Menu";
import { PageDescription } from "../PageDescription";
import { PersonField } from "../PersonField";
import type { RichEditorHandlers } from "../RichEditor/useEditor";
import { SidebarNotificationSection, SidebarSection } from "../SidebarSection";
import { TextField } from "../TextField";
import { showErrorToast, showSuccessToast } from "../Toasts";
import { IconLink, IconMessage, IconTrash } from "../icons";
import { KpiLineChart } from "./KpiLineChart";
import { TrendIndicator } from "./TrendIndicator";
import type { SpaceKpisPage } from "./types";
import type { KpiFields } from "./useKpiFields";
import { CADENCE_OPTIONS, formatCadence, formatShortDate, formatValue, latestEntry, latestTrend } from "./utils";

interface KpiDetailProps {
  kpi: SpaceKpisPage.Kpi;
  fields: KpiFields;
  canManage: boolean;
  canComment?: boolean;
  championSearch: (query: string) => Promise<SpaceKpisPage.Person[]>;
  onDescriptionChange: (kpiId: string, description: Record<string, unknown>) => Promise<boolean>;
  onDelete: () => void;
  richTextHandlers: RichEditorHandlers;
  renderEntryComments?: SpaceKpisPage.Props["renderEntryComments"];
  subscriptions?: SpaceKpisPage.Props["subscriptions"];
}

// The KPI name, back navigation and the "Log update" action live in the shared
// page header (see index.tsx). The latest value is in the sidebar last-update
// card, so the main column is the history chart and the recorded-updates log.
export function KpiDetail({
  kpi,
  fields,
  canManage,
  canComment = false,
  championSearch,
  onDescriptionChange,
  onDelete,
  richTextHandlers,
  renderEntryComments,
  subscriptions,
}: KpiDetailProps) {
  const [description, setDescription] = React.useState(kpi.description);

  React.useEffect(() => {
    setDescription(kpi.description);
  }, [kpi.id, kpi.description]);

  const saveDescription = async (nextDescription: Record<string, unknown>) => {
    const success = await onDescriptionChange(kpi.id, nextDescription);
    if (success) setDescription(nextDescription);
    return success;
  };

  return (
    <div className="sm:grid sm:grid-cols-12 sm:gap-8" data-test-id="kpi-detail">
      <div className="space-y-12 sm:col-span-8">
        <PageDescription
          description={description}
          onDescriptionChange={saveDescription}
          richTextHandlers={richTextHandlers}
          label="Description"
          placeholder="Describe this KPI..."
          zeroStatePlaceholder="Add a description..."
          testId="kpi-description"
          emptyTestId="kpi-description-empty"
          localDraftKey={`kpi:${kpi.id}:description`}
          canEdit={canManage}
        />

        <div>
          <div className="rounded-lg border border-stroke-base bg-surface-base p-4">
            <h2 className="mb-3 text-sm font-bold text-content-accent">History</h2>
            <KpiLineChart entries={kpi.entries} unit={fields.unit} />
          </div>

          <EntriesTable
            entries={kpi.entries}
            unit={fields.unit}
            canComment={canComment}
            renderEntryComments={renderEntryComments}
          />
        </div>
      </div>

      <KpiSidebar
        kpi={kpi}
        fields={fields}
        canManage={canManage}
        championSearch={championSearch}
        onDelete={onDelete}
        subscriptions={subscriptions}
      />
    </div>
  );
}

function KpiSidebar({
  kpi,
  fields,
  canManage,
  championSearch,
  onDelete,
  subscriptions,
}: {
  kpi: SpaceKpisPage.Kpi;
  fields: KpiFields;
  canManage: boolean;
  championSearch: (query: string) => Promise<SpaceKpisPage.Person[]>;
  onDelete: () => void;
  subscriptions?: SpaceKpisPage.Props["subscriptions"];
}) {
  const searchData = useChampionSearch(championSearch);

  return (
    <aside className="mt-8 space-y-6 sm:col-span-4 sm:mt-0 sm:pl-8" data-test-id="kpi-sidebar">
      <LastUpdate kpi={kpi} unit={fields.unit} canManage={canManage} />

      <SidebarSection title="Champion">
        {canManage ? (
          <PersonField
            person={fields.champion}
            setPerson={(champion) => fields.update({ champion })}
            searchData={searchData}
            emptyStateMessage="Set champion"
            emptyStateReadOnlyMessage="No champion"
            testId="kpi-champion"
          />
        ) : (
          <PersonField
            person={fields.champion}
            readonly
            emptyStateReadOnlyMessage="No champion"
            testId="kpi-champion"
          />
        )}
      </SidebarSection>

      <SidebarSection title="Cadence">
        <CadenceField
          cadence={fields.cadence}
          readonly={!canManage}
          onChange={(cadence) => fields.update({ cadence })}
        />
      </SidebarSection>

      <SidebarSection title="Unit">
        <TextField
          className="text-sm text-content-base"
          text={fields.unit}
          onChange={(unit) => fields.update({ unit })}
          readonly={!canManage}
          trimBeforeSave
          testId="kpi-unit"
        />
      </SidebarSection>

      {subscriptions && <SidebarNotificationSection {...subscriptions} />}

      <Actions canManage={canManage} onDelete={onDelete} />
    </aside>
  );
}

// The KPI's whole-page actions, listed in the sidebar the way a task page lists
// its own, rather than hidden behind an overflow menu.
function Actions({ canManage, onDelete }: { canManage: boolean; onDelete: () => void }) {
  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showSuccessToast("Success", "KPI URL copied to clipboard");
    } catch {
      showErrorToast("Copy failed", "Unable to copy URL to clipboard");
    }
  };

  const actions = [
    {
      type: "action" as const,
      label: "Copy URL",
      onClick: copyUrl,
      icon: IconLink,
      testId: "copy-kpi-url",
    },
    {
      type: "action" as const,
      label: "Delete",
      onClick: onDelete,
      icon: IconTrash,
      hidden: !canManage,
      danger: true,
      testId: "delete-kpi",
    },
  ];

  return (
    <SidebarSection title="Actions">
      <ActionList actions={actions} />
    </SidebarSection>
  );
}

// The KPI's current reading, and the only place the latest value appears on the
// detail page. The value leads, with the change since the previous entry beside
// it; when it was recorded and by whom are supporting details underneath.
function LastUpdate({ kpi, unit, canManage }: { kpi: SpaceKpisPage.Kpi; unit: string; canManage: boolean }) {
  const latest = latestEntry(kpi);
  const trend = latestTrend(kpi);

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
      <div data-test-id="kpi-last-update">
        <div className="flex items-center gap-2">
          <div className="text-3xl font-bold leading-none text-content-accent">{formatValue(latest.value, unit)}</div>
          <TrendIndicator delta={trend} />
        </div>

        <div className="mt-2 flex items-center gap-1.5 text-xs text-content-dimmed">
          <span>{formatShortDate(latest.recordedAt)}</span>

          {latest.recordedBy && (
            <>
              <span aria-hidden="true">·</span>
              <Avatar person={latest.recordedBy} size={16} />
              <span>{latest.recordedBy.fullName.split(" ")[0]}</span>
            </>
          )}
        </div>
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

function EntriesTable({
  entries,
  unit,
  canComment,
  renderEntryComments,
}: {
  entries: SpaceKpisPage.KpiEntry[];
  unit: string;
  canComment: boolean;
  renderEntryComments?: SpaceKpisPage.Props["renderEntryComments"];
}) {
  const [openEntryId, setOpenEntryId] = React.useState<string | null>(null);

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
              <th className="px-4 py-2 text-right font-medium">Comments</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((entry) => {
              const isOpen = openEntryId === entry.id;
              const commentsCount = entry.commentsCount ?? 0;
              const canOpenComments = Boolean(renderEntryComments) && (canComment || commentsCount > 0);

              return (
                <React.Fragment key={entry.id}>
                  <tr className="border-b border-stroke-dimmed last:border-b-0" data-test-id={`entry-row-${entry.id}`}>
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
                    <td className="px-4 py-2 text-right font-medium text-content-accent">{formatValue(entry.value, unit)}</td>
                    <td className="px-4 py-2 text-right">
                      {canOpenComments ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded px-1.5 py-1 text-xs font-medium text-content-dimmed hover:bg-surface-dimmed hover:text-content-base"
                          onClick={() => setOpenEntryId(isOpen ? null : entry.id)}
                          data-test-id={`entry-comments-toggle-${entry.id}`}
                          aria-expanded={isOpen}
                        >
                          <IconMessage size={14} />
                          {commentsCount > 0 ? commentsCount : "Comment"}
                        </button>
                      ) : commentsCount > 0 ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-content-dimmed">
                          <IconMessage size={14} />
                          {commentsCount}
                        </span>
                      ) : null}
                    </td>
                  </tr>
                  {isOpen && renderEntryComments && (
                    <tr className="border-b border-stroke-dimmed last:border-b-0 bg-surface-base" data-test-id={`entry-comments-${entry.id}`}>
                      <td colSpan={4} className="px-4 py-4">
                        {renderEntryComments(entry)}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
