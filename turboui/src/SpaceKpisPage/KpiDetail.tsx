import React from "react";

import { ActionList } from "../ActionList";
import { Avatar } from "../Avatar";
import { Menu, MenuActionItem } from "../Menu";
import { PageDescription } from "../PageDescription";
import { PersonField } from "../PersonField";
import type { RichEditorHandlers } from "../RichEditor/useEditor";
import { SidebarNotificationSection, SidebarSection } from "../SidebarSection";
import { TextField } from "../TextField";
import { SlideIn } from "../SlideIn";
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

// The KPI's name leads its page, with the current reading beside it, so the two
// questions a KPI answers — which metric is this, and where does it stand — are
// answered before the description, chart and recorded-updates log below.
// Back navigation and the "Log update" action live in the page header (index.tsx).
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
    <div className="sm:grid sm:grid-cols-12" data-test-id="kpi-detail">
      <div className="space-y-10 sm:col-span-8 sm:pr-8">
        <div className="space-y-6">
          <Heading fields={fields} canManage={canManage} />

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
        </div>

        <div
          className="space-y-4 rounded-lg border border-stroke-base bg-surface-base px-5 pb-3 pt-4"
          data-test-id="kpi-history"
        >
          <CurrentValue kpi={kpi} unit={fields.unit} />
          <KpiLineChart entries={kpi.entries} unit={fields.unit} />
        </div>

        <EntriesTable
          entries={kpi.entries}
          unit={fields.unit}
          kpiName={fields.name}
          canComment={canComment}
          renderEntryComments={renderEntryComments}
        />
      </div>

      <KpiSidebar
        fields={fields}
        canManage={canManage}
        championSearch={championSearch}
        onDelete={onDelete}
        subscriptions={subscriptions}
      />
    </div>
  );
}

// Section heading matching the description's, so the page reads as one column of
// evenly weighted sections rather than a stack of differently styled cards.
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-bold">{title}</h2>
      <div className="mt-2">{children}</div>
    </div>
  );
}

// A KPI is renamed where its name is read, the way a task is renamed on its own
// page. The editable field cannot live inside a heading element, so the role is
// set on its container to keep the page's heading.
function Heading({ fields, canManage }: { fields: KpiFields; canManage: boolean }) {
  return (
    <div role="heading" aria-level={1} className="min-w-0" data-test-id="kpi-heading">
      <TextField
        className="text-2xl font-bold leading-tight text-content-accent"
        text={fields.name}
        onChange={(name) => fields.update({ name })}
        readonly={!canManage}
        trimBeforeSave
        testId="kpi-name"
      />
    </div>
  );
}

// The KPI's latest reading, leading the chart it is the newest point of, with
// the change since the entry before it and the date it was recorded. Who
// recorded it is in the recorded-updates log. With no entries there is no
// reading to show and the chart says so instead.
function CurrentValue({ kpi, unit }: { kpi: SpaceKpisPage.Kpi; unit: string }) {
  const latest = latestEntry(kpi);
  if (!latest) return null;

  return (
    <div data-test-id="kpi-current-value">
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold leading-none text-content-accent">{formatValue(latest.value, unit)}</span>
        <TrendIndicator delta={latestTrend(kpi)} variant="badge" />
      </div>

      <div className="mt-1.5 text-xs leading-none text-content-dimmed">as of {formatShortDate(latest.recordedAt)}</div>
    </div>
  );
}

function KpiSidebar({
  fields,
  canManage,
  championSearch,
  onDelete,
  subscriptions,
}: {
  fields: KpiFields;
  canManage: boolean;
  championSearch: (query: string) => Promise<SpaceKpisPage.Person[]>;
  onDelete: () => void;
  subscriptions?: SpaceKpisPage.Props["subscriptions"];
}) {
  const searchData = useChampionSearch(championSearch);

  return (
    <aside className="mt-8 space-y-6 sm:col-span-4 sm:mt-0 sm:pl-8" data-test-id="kpi-sidebar">
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

// The comment composer's editor toolbar needs about 570px before it starts
// clipping, so the panel keeps a floor of 680px and only narrows to the full
// screen when the window itself is smaller than that.
const COMMENTS_PANEL_WIDTH = "min(100%, max(70%, 680px))";

function EntriesTable({
  entries,
  unit,
  kpiName,
  canComment,
  renderEntryComments,
}: {
  entries: SpaceKpisPage.KpiEntry[];
  unit: string;
  kpiName: string;
  canComment: boolean;
  renderEntryComments?: SpaceKpisPage.Props["renderEntryComments"];
}) {
  const [openEntryId, setOpenEntryId] = React.useState<string | null>(null);
  const openEntry = entries.find((entry) => entry.id === openEntryId) ?? null;

  if (entries.length === 0) return null;

  // Show newest first in the log, even though entries are stored oldest -> newest.
  const rows = [...entries].reverse();

  return (
    <Section title="Recorded updates">
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
                <tr
                  key={entry.id}
                  className="border-b border-stroke-dimmed last:border-b-0 hover:bg-surface-highlight"
                  data-test-id={`entry-row-${entry.id}`}
                >
                  <td className="whitespace-nowrap px-4 py-2.5 text-content-base">
                    {formatShortDate(entry.recordedAt)}
                  </td>
                  <td className="px-4 py-2.5">
                    {entry.recordedBy ? (
                      <div className="flex items-center gap-2">
                        <Avatar person={entry.recordedBy} size="tiny" />
                        <span className="text-content-base">{entry.recordedBy.fullName}</span>
                      </div>
                    ) : (
                      <span className="text-content-subtle">Unknown</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right font-medium text-content-accent">
                    {formatValue(entry.value, unit)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {canOpenComments ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded px-1.5 py-1 text-xs font-medium text-content-dimmed hover:bg-surface-dimmed hover:text-content-base"
                        onClick={() => setOpenEntryId(isOpen ? null : entry.id)}
                        data-test-id={`entry-comments-toggle-${entry.id}`}
                        aria-expanded={isOpen}
                        aria-label={commentsCount > 0 ? `${commentsCount} comments` : "Comment on this update"}
                      >
                        <IconMessage size={14} />
                        {commentsCount > 0 ? commentsCount : null}
                      </button>
                    ) : commentsCount > 0 ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-content-dimmed">
                        <IconMessage size={14} />
                        {commentsCount}
                      </span>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <SlideIn
        isOpen={Boolean(openEntry && renderEntryComments)}
        onClose={() => setOpenEntryId(null)}
        width={COMMENTS_PANEL_WIDTH}
        testId="entry-comments-slide-in"
        header={openEntry ? <EntryCommentsHeader entry={openEntry} unit={unit} kpiName={kpiName} /> : undefined}
      >
        {openEntry && renderEntryComments && (
          <div className="px-6 py-4" data-test-id={`entry-comments-${openEntry.id}`}>
            {renderEntryComments(openEntry)}
          </div>
        )}
      </SlideIn>
    </Section>
  );
}

// The update under discussion leads the panel: the value it recorded, then who
// logged it and when. The KPI name sits above as context, since the panel covers
// the page that would otherwise carry it.
function EntryCommentsHeader({
  entry,
  unit,
  kpiName,
}: {
  entry: SpaceKpisPage.KpiEntry;
  unit: string;
  kpiName: string;
}) {
  return (
    <div className="border-b border-stroke-base px-6 py-4 pr-12" data-test-id="entry-comments-header">
      <div className="text-xs text-content-dimmed">{kpiName}</div>

      <h2 className="mt-1 text-2xl font-bold leading-none text-content-accent">{formatValue(entry.value, unit)}</h2>

      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-content-dimmed">
        {entry.recordedBy ? (
          <>
            <span>Logged by</span>
            <Avatar person={entry.recordedBy} size={16} />
            <span>
              <span className="font-medium text-content-base">{entry.recordedBy.fullName}</span> on{" "}
              {formatShortDate(entry.recordedAt)}
            </span>
          </>
        ) : (
          <span>Logged on {formatShortDate(entry.recordedAt)}</span>
        )}
      </div>
    </div>
  );
}
