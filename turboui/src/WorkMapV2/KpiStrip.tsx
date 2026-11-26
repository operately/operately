import React from "react";
import { useTranslation } from "react-i18next";
import type { WorkMapKpi } from "../ApiTypes";
import { UnstyledButton } from "../Button/UnstalyedButton";
import type { FormattedTimePreferences } from "../FormattedTime";
import { BlackLink, DimmedActionLink, DimmedLink, Link } from "../Link";
import { IconChartLine, IconChevronRight } from "../icons";
import { KpiFormattingProvider, KpiDate, useKpiFormatting } from "../SpaceKpisPage/formatting";
import { KpiSparkline } from "../SpaceKpisPage/KpiSparkline";
import { fromIsoDate } from "../SpaceKpisPage/utils";
import { PinManager } from "./PinManager";

export interface WorkMapKpiStrip {
  pins: WorkMapKpi[];
  latestKpis: WorkMapKpi[];
  limit: number;
  loading: boolean;
  error: boolean;
  retry: () => void;
  allPath?: string;
  createPath?: string;
  detailPath: (kpi: WorkMapKpi) => string;
  search: (input: { query: string; offset: number } | null) => void;
  results: WorkMapKpi[];
  searching: boolean;
  searchError: boolean;
  retrySearch: () => void;
  hasMore: boolean;
  saving: boolean;
  save?: (ids: string[]) => void;
}

export function KpiStrip({
  data,
  spaceName,
  preferences,
}: {
  data: WorkMapKpiStrip;
  spaceName?: string;
  preferences: FormattedTimePreferences;
}) {
  const { t } = useTranslation();
  const displayedKpis = [...data.pins, ...data.latestKpis];
  const [panel, setPanel] = React.useState<"manage" | "browse" | null>(null);
  const close = React.useCallback(() => setPanel(null), []);
  const title = (
    <>
      <IconChartLine size={16} className="text-callout-success-content" />
      {t("KPIs")}
    </>
  );
  const labelClass = "inline-flex items-center gap-2 text-sm font-semibold text-link-base underline";
  const actionClass = "ml-auto inline-flex shrink-0 items-center gap-2 px-2 py-1 text-sm font-medium";

  return (
    <KpiFormattingProvider value={preferences}>
      <section
        aria-label={t("KPIs")}
        className="flex flex-wrap items-center gap-y-2 border-b border-surface-outline bg-surface-dimmed px-4 py-3 sm:min-h-[60px] sm:flex-nowrap sm:px-7 sm:py-2 dark:bg-[#212329]"
      >
        <div className="shrink-0 border-r border-surface-outline pr-5 sm:min-w-[102px]">
          {data.allPath ? (
            <Link to={data.allPath} className={labelClass}>
              {title}
            </Link>
          ) : (
            <UnstyledButton onClick={() => setPanel("browse")} className={labelClass}>
              {title}
            </UnstyledButton>
          )}
          <div className="text-xs text-content-dimmed">
            {spaceName ? t("{{name}} space", { name: spaceName }) : t("Across spaces")}
          </div>
        </div>

        {data.error ? (
          <div role="alert" className="px-4 text-sm">
            {t("Couldn’t load KPIs")}{" "}
            <UnstyledButton className="text-link-base underline" onClick={data.retry}>
              {t("Try again")}
            </UnstyledButton>
          </div>
        ) : data.loading ? (
          <span role="status" className="px-4 text-sm text-content-dimmed">
            {t("Loading…")}
          </span>
        ) : (
          <>
            {displayedKpis.length > 0 ? (
              <div className="order-last flex w-full min-w-0 overflow-x-auto sm:order-none sm:min-h-[73px] sm:w-auto sm:flex-1 sm:items-center">
                {displayedKpis.map((kpi) => (
                  <KpiSummary key={kpi.id} kpi={kpi} href={data.detailPath(kpi)} />
                ))}
              </div>
            ) : (
              <div className="order-last w-full text-sm text-content-dimmed sm:order-none sm:w-auto sm:min-w-0 sm:flex-1 sm:px-4">
                {t("No KPIs yet. Track a number over time, like weekly active teams.")}
              </div>
            )}
            {displayedKpis.length > 0 && data.save && (
              <DimmedActionLink
                testId="manage-work-map-pins"
                onClick={() => setPanel("manage")}
                underline="never"
                className={actionClass}
              >
                {data.pins.length ? t("Manage pins") : t("Pin KPIs")} <IconChevronRight size={15} />
              </DimmedActionLink>
            )}
            {displayedKpis.length === 0 && data.createPath && (
              <DimmedLink to={data.createPath} underline="never" className={actionClass}>
                {t("Create a KPI")} <IconChevronRight size={15} aria-hidden="true" />
              </DimmedLink>
            )}
          </>
        )}
      </section>

      {panel && !data.loading && !data.error && (
        <PinManager
          mode={panel === "manage" && data.save ? "manage" : "browse"}
          onBrowse={() => setPanel("browse")}
          onClose={close}
          data={data}
        />
      )}
    </KpiFormattingProvider>
  );
}

function KpiSummary({ kpi, href }: { kpi: WorkMapKpi; href: string }) {
  const { t } = useTranslation();
  const { formatNumber } = useKpiFormatting();
  return (
    <BlackLink
      testId={`work-map-kpi-${kpi.id}`}
      to={href}
      underline="hover"
      className="flex min-h-12 shrink-0 items-center gap-2 border-r border-surface-outline px-3 first:pl-0 last:border-0 sm:min-h-[61px] sm:gap-2 sm:px-4 sm:first:pl-4"
    >
      <div>
        <div className="max-w-52 truncate text-[13px] font-medium">{kpi.name}</div>
        <div className="text-xs text-content-dimmed">
          {kpi.spaceName}
          {kpi.period && (
            <>
              {" "}
              · <KpiDate time={fromIsoDate(kpi.period)} />
            </>
          )}
        </div>
      </div>
      {kpi.value === null ? (
        <span className="text-xs text-content-dimmed">{t("No data")}</span>
      ) : (
        <>
          <strong className="text-2xl font-semibold tabular-nums">{formatNumber(kpi.value)}</strong>
          <span className="text-xs text-content-dimmed">{kpi.unit}</span>
          <KpiSparkline entries={kpi.recentValues.map((value) => ({ value }))} width={80} height={26} />
        </>
      )}
    </BlackLink>
  );
}
