import React from "react";
import { useTranslation } from "react-i18next";
import type { WorkMapKpi } from "../ApiTypes";
import { UnstyledButton } from "../Button/UnstalyedButton";
import { Textfield } from "../FormElements/Textfield";
import { BlackLink, Link } from "../Link";
import { SlideIn } from "../SlideIn";
import { IconChartLine, IconPin, IconSearch } from "../icons";
import { KpiDate, useKpiFormatting } from "../SpaceKpisPage/formatting";
import { formatCadence, fromIsoDate } from "../SpaceKpisPage/utils";
import { DragHandle, DropIndicator, useSortableItem, useSortableList } from "../utils/PragmaticDragAndDrop";
import type { WorkMapKpiStrip } from "./KpiStrip";

type TogglePin = (id: string, event: React.MouseEvent<HTMLButtonElement>) => void;

const SEARCH_DEBOUNCE_MS = 180;
const SEARCH_PAGE_SIZE = 50;
const SECTION_HEADING_CLASS =
  "border-y border-surface-outline bg-surface-dimmed px-6 py-2 text-xs font-semibold text-content-dimmed";

export function PinManager({
  data,
  mode,
  onBrowse,
  onClose,
}: {
  data: WorkMapKpiStrip;
  mode: "manage" | "browse";
  onBrowse: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const searchInput = React.useRef<HTMLInputElement>(null);
  const { query, offset, setOffset, changeQuery } = useKpiSearch(data.search);
  const isManaging = mode === "manage";
  const pinnedIds = data.pins.map((pin) => pin.id);
  const title = isManaging ? t("Manage pins") : t("View all KPIs");

  // Keyboard activation (detail 0) would lose focus when the clicked control unmounts.
  function keepFocusOnKeyboardActivation(event: React.MouseEvent<HTMLButtonElement>) {
    if (event.detail === 0) searchInput.current?.focus();
  }

  const togglePin: TogglePin = (id, event) => {
    keepFocusOnKeyboardActivation(event);
    data.save?.(pinnedIds.includes(id) ? pinnedIds.filter((pinnedId) => pinnedId !== id) : [...pinnedIds, id]);
  };

  function reorder(id: string, index: number) {
    const isOutOfRange = index < 0 || index >= pinnedIds.length;
    if (!isManaging || data.saving || isOutOfRange || pinnedIds[index] === id) return;

    const reordered = pinnedIds.filter((pinnedId) => pinnedId !== id);
    reordered.splice(index, 0, id);
    data.save?.(reordered);
  }

  useSortableList(
    data.pins.map(({ id }, index) => ({ id, index })),
    reorder,
  );

  function browseAll(event: React.MouseEvent<HTMLButtonElement>) {
    keepFocusOnKeyboardActivation(event);
    changeQuery("");
    onBrowse();
  }

  const searchResults = isManaging ? data.results.filter((kpi) => !pinnedIds.includes(kpi.id)) : data.results;

  return (
    <SlideIn
      isOpen
      trapFocus
      onClose={onClose}
      title={title}
      width="min(454px, 100vw)"
      overlayClassName="[top:anchor(--company-page_top,0px)]"
      contentClassName="border-l border-surface-outline dark:bg-[#292a31]"
    >
      <PanelHeader title={title} isManaging={isManaging} allPath={data.allPath} onBrowseAll={browseAll} />

      {isManaging && <PinnedSection data={data} reorder={reorder} togglePin={togglePin} />}

      <SearchField ref={searchInput} query={query} isManaging={isManaging} onChange={changeQuery} />
      <SearchResults
        data={data}
        kpis={searchResults}
        canPin={isManaging}
        isPinLimitReached={pinnedIds.length >= data.limit}
        togglePin={togglePin}
        offset={offset}
        onOffsetChange={setOffset}
      />
    </SlideIn>
  );
}

function useKpiSearch(search: WorkMapKpiStrip["search"]) {
  const [query, setQuery] = React.useState("");
  const [offset, setOffset] = React.useState(0);

  React.useEffect(() => {
    if (!query) {
      search({ query, offset });
      return;
    }
    const timer = setTimeout(() => search({ query, offset }), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search, query, offset]);

  React.useEffect(() => () => search(null), [search]);

  function changeQuery(nextQuery: string) {
    setQuery(nextQuery);
    setOffset(0);
  }

  return { query, offset, setOffset, changeQuery };
}

function PanelHeader({
  title,
  isManaging,
  allPath,
  onBrowseAll,
}: {
  title: string;
  isManaging: boolean;
  allPath?: string;
  onBrowseAll: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  const { t } = useTranslation();

  return (
    <header className="space-y-2 px-6 py-4">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <IconChartLine size={18} />
        {title}
      </h2>
      {isManaging && (
        <>
          <p className="text-sm text-content-dimmed">
            {t("Drag pinned KPIs into the order you want on the Work Map.")}
          </p>
          {allPath ? (
            <Link to={allPath} className="text-sm">
              {t("View all KPIs")}
            </Link>
          ) : (
            <UnstyledButton className="text-sm text-link-base underline" onClick={onBrowseAll}>
              {t("View all KPIs")}
            </UnstyledButton>
          )}
        </>
      )}
    </header>
  );
}

function PinnedSection({
  data,
  reorder,
  togglePin,
}: {
  data: WorkMapKpiStrip;
  reorder: (id: string, index: number) => void;
  togglePin: TogglePin;
}) {
  const { t } = useTranslation();

  return (
    <>
      <h3 className={SECTION_HEADING_CLASS}>
        {t("Pinned to Work Map · {{used}} of {{limit}}", { used: data.pins.length, limit: data.limit })}
      </h3>
      {data.pins.map((kpi, index) => (
        <PinnedRow key={kpi.id} kpi={kpi} index={index} reorder={reorder} data={data} togglePin={togglePin} />
      ))}
    </>
  );
}

const SearchField = React.forwardRef<
  HTMLInputElement,
  { query: string; isManaging: boolean; onChange: (query: string) => void }
>(function SearchField({ query, isManaging, onChange }, ref) {
  const { t } = useTranslation();

  return (
    <div className="relative px-6 py-4">
      <IconSearch
        size={14}
        className="pointer-events-none absolute left-9 top-1/2 -translate-y-1/2 text-content-dimmed"
      />
      <Textfield
        ref={ref}
        aria-label={t("Search KPIs")}
        placeholder={isManaging ? t("Find a KPI to pin…") : t("Search KPIs")}
        inputClassName="!pl-8 text-sm"
        value={query}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
});

function SearchResults({
  data,
  kpis,
  canPin,
  isPinLimitReached,
  togglePin,
  offset,
  onOffsetChange,
}: {
  data: WorkMapKpiStrip;
  kpis: WorkMapKpi[];
  canPin: boolean;
  isPinLimitReached: boolean;
  togglePin: TogglePin;
  offset: number;
  onOffsetChange: (offset: number) => void;
}) {
  const { t } = useTranslation();

  if (data.searchError) {
    return (
      <div role="alert" className="px-6 text-sm">
        {t("Couldn’t load KPIs")}{" "}
        <UnstyledButton className="text-link-base underline" onClick={data.retrySearch}>
          {t("Try again")}
        </UnstyledButton>
      </div>
    );
  }

  if (data.searching) {
    return (
      <div role="status" className="px-6 text-sm">
        {t("Loading…")}
      </div>
    );
  }

  const kpisBySpace = groupBySpace(kpis);
  const hasPreviousPage = offset > 0;

  return (
    <>
      {kpisBySpace.map(([spaceId, spaceKpis]) => (
        <div key={spaceId}>
          <h3 className={SECTION_HEADING_CLASS}>{spaceKpis[0]?.spaceName}</h3>
          {spaceKpis.map((kpi) => (
            <div key={kpi.id} className="flex items-center gap-3 border-b border-surface-outline px-6 py-3">
              <KpiDetails kpi={kpi} href={data.detailPath(kpi)} />
              {canPin && (
                <PinButton kpi={kpi} pinned={false} disabled={data.saving || isPinLimitReached} onToggle={togglePin} />
              )}
            </div>
          ))}
        </div>
      ))}
      {kpisBySpace.length === 0 && <p className="px-6 text-sm text-content-dimmed">{t("No matching KPIs")}</p>}
      {(hasPreviousPage || data.hasMore) && (
        <div className="flex justify-between px-6 py-3 text-sm">
          <UnstyledButton
            disabled={!hasPreviousPage}
            onClick={() => onOffsetChange(Math.max(0, offset - SEARCH_PAGE_SIZE))}
          >
            {t("Previous")}
          </UnstyledButton>
          <UnstyledButton disabled={!data.hasMore} onClick={() => onOffsetChange(offset + data.results.length)}>
            {t("Next")}
          </UnstyledButton>
        </div>
      )}
    </>
  );
}

function groupBySpace(kpis: WorkMapKpi[]): [string, WorkMapKpi[]][] {
  const groups = new Map<string, WorkMapKpi[]>();
  for (const kpi of kpis) {
    const group = groups.get(kpi.spaceId);
    if (group) group.push(kpi);
    else groups.set(kpi.spaceId, [kpi]);
  }
  return [...groups];
}

function PinnedRow({
  kpi,
  index,
  reorder,
  togglePin,
  data,
}: {
  kpi: WorkMapKpi;
  index: number;
  reorder: (id: string, index: number) => void;
  togglePin: TogglePin;
  data: WorkMapKpiStrip;
}) {
  const { t } = useTranslation();
  const { ref, dragHandleRef, isDragging, closestEdge } = useSortableItem<HTMLDivElement>({
    itemId: kpi.id,
    index,
    scope: "work-map-pins",
    disabled: data.saving,
  });

  return (
    <div
      ref={ref}
      className={`relative flex items-center gap-3 border-b border-surface-outline px-6 py-3 ${isDragging ? "opacity-50" : ""}`}
    >
      <span
        ref={dragHandleRef as React.RefObject<HTMLSpanElement>}
        onKeyDown={(e) => {
          if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
          e.preventDefault();
          reorder(kpi.id, index + (e.key === "ArrowUp" ? -1 : 1));
        }}
      >
        <UnstyledButton ariaLabel={t("Reorder {{name}}", { name: kpi.name })} className="cursor-grab">
          <DragHandle isDragging={isDragging} className="opacity-100" />
        </UnstyledButton>
      </span>

      <KpiDetails kpi={kpi} pinned href={data.detailPath(kpi)} />
      <PinButton kpi={kpi} pinned disabled={data.saving} onToggle={togglePin} />
      {closestEdge && !isDragging && <DropIndicator edge={closestEdge} />}
    </div>
  );
}

function KpiDetails({ kpi, pinned, href }: { kpi: WorkMapKpi; pinned?: boolean; href: string }) {
  const { t } = useTranslation();
  const { formatValue } = useKpiFormatting();

  return (
    <>
      <div className="min-w-0 flex-1">
        <BlackLink to={href} underline="hover" className="block truncate text-sm font-medium">
          {kpi.name}
        </BlackLink>
        <div className="text-xs text-content-dimmed">
          {pinned && kpi.spaceName}
          {pinned && kpi.period && " · "}
          {kpi.period && <KpiDate time={fromIsoDate(kpi.period)} />}
          {!pinned && (
            <>
              {kpi.period && " · "}
              {formatCadence(kpi.cadence)}
            </>
          )}
        </div>
      </div>
      <span className="shrink-0 text-sm font-medium">
        {kpi.value === null ? t("No data") : formatValue(kpi.value, kpi.unit)}
      </span>
    </>
  );
}

function PinButton({
  kpi,
  pinned,
  disabled,
  onToggle,
}: {
  kpi: WorkMapKpi;
  pinned: boolean;
  disabled: boolean;
  onToggle: TogglePin;
}) {
  const { t } = useTranslation();

  return (
    <UnstyledButton
      testId={`${pinned ? "unpin" : "pin"}-${kpi.id}`}
      ariaLabel={pinned ? t("Unpin {{name}}", { name: kpi.name }) : t("Pin {{name}}", { name: kpi.name })}
      disabled={disabled}
      onClick={(event) => onToggle(kpi.id, event)}
      className={`rounded p-1.5 disabled:opacity-40 ${pinned ? "bg-surface-accent text-link-base" : "text-content-dimmed hover:bg-surface-accent"}`}
    >
      <IconPin size={15} />
    </UnstyledButton>
  );
}
