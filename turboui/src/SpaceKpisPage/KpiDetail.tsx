import React from "react";

import { Avatar } from "../Avatar";
import { CurrentSubscriptions } from "../Subscriptions/CurrentSubscriptions";
import { KpiLineChart } from "./KpiLineChart";
import { TrendIndicator } from "./TrendIndicator";
import type { SpaceKpisPage } from "./types";
import { formatCadence, formatShortDate, formatValue, latestEntry, latestTrend } from "./utils";

interface KpiDetailProps {
  kpi: SpaceKpisPage.Kpi;

  // True while the KPI's entries are still being fetched (the list endpoint
  // omits them). Shows a placeholder in place of the chart/history so we don't
  // flash a misleading "No data" state.
  loadingHistory?: boolean;

  kpiSubscriptions?: SpaceKpisPage.KpiSubscriptionsHandlers;
  canEditKpiSubscribers?: boolean;
}

// The KPI name, back navigation and the "Log update" action live in the shared
// page header (see index.tsx), so the detail body focuses on the metadata,
// latest value, history chart and the recorded-updates log.
export function KpiDetail({
  kpi,
  loadingHistory = false,
  kpiSubscriptions,
  canEditKpiSubscribers = false,
}: KpiDetailProps) {
  const latest = latestEntry(kpi);
  const trend = latestTrend(kpi);

  const subscribedPeople = (kpi.potentialSubscribers ?? []).filter((subscriber) => subscriber.isSubscribed);
  const subscriptionsReady = Boolean(kpi.subscriptionListId);
  const showSubscriptions = Boolean(kpiSubscriptions);

  return (
    <div data-test-id="kpi-detail">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-content-dimmed">
        <span>
          Measured in <span className="font-medium text-content-base">{kpi.unit}</span>
        </span>
        <span>
          Cadence <span className="font-medium text-content-base">{formatCadence(kpi.cadence)}</span>
        </span>
        <span className="flex items-center gap-1.5">
          Champion
          {kpi.champion ? (
            <span className="flex items-center gap-1.5 font-medium text-content-base">
              <Avatar person={kpi.champion} size="tiny" />
              {kpi.champion.fullName}
            </span>
          ) : (
            <span className="font-medium text-content-subtle">Unassigned</span>
          )}
        </span>
      </div>

      {loadingHistory ? (
        <div className="mt-6 space-y-6" data-test-id="kpi-detail-loading">
          <div className="h-10 w-40 animate-pulse rounded bg-surface-dimmed" />
          <div className="h-[220px] animate-pulse rounded-lg bg-surface-dimmed" />
        </div>
      ) : (
        <>
          <div className="mt-6 flex items-end gap-3">
            <div className="text-4xl font-bold text-content-accent">
              {latest ? formatValue(latest.value, kpi.unit) : "—"}
            </div>
            <div className="pb-1">
              <TrendIndicator delta={trend} />
            </div>
            {latest && (
              <div className="pb-1.5 text-xs text-content-dimmed">latest · {formatShortDate(latest.recordedAt)}</div>
            )}
          </div>

          <div className="mt-6 rounded-lg border border-stroke-base bg-surface-base p-4">
            <h2 className="mb-3 text-sm font-bold text-content-accent">History</h2>
            <KpiLineChart entries={kpi.entries} unit={kpi.unit} />
          </div>

          <EntriesTable entries={kpi.entries} unit={kpi.unit} />
        </>
      )}

      {showSubscriptions && (
        <div className="mt-6 border-t border-stroke-dimmed pt-4" data-test-id="kpi-subscriptions">
          {loadingHistory || !subscriptionsReady ? (
            <SubscriptionsLoading />
          ) : (
            <KpiSubscriptionsSection
              kpi={kpi}
              kpiSubscriptions={kpiSubscriptions!}
              canEditKpiSubscribers={canEditKpiSubscribers}
              subscribedPeople={subscribedPeople}
            />
          )}
        </div>
      )}
    </div>
  );
}

function SubscriptionsLoading() {
  return (
    <div className="space-y-3" data-test-id="kpi-subscriptions-loading">
      <div className="h-4 w-24 animate-pulse rounded bg-surface-dimmed" />
      <div className="h-4 w-64 animate-pulse rounded bg-surface-dimmed" />
      <div className="h-8 w-28 animate-pulse rounded bg-surface-dimmed" />
    </div>
  );
}

function KpiSubscriptionsSection({
  kpi,
  kpiSubscriptions,
  canEditKpiSubscribers,
  subscribedPeople,
}: {
  kpi: SpaceKpisPage.Kpi;
  kpiSubscriptions: SpaceKpisPage.KpiSubscriptionsHandlers;
  canEditKpiSubscribers: boolean;
  subscribedPeople: NonNullable<SpaceKpisPage.Kpi["potentialSubscribers"]>;
}) {
  const subscriptionListId = kpi.subscriptionListId!;
  const [isSubscribeLoading, setIsSubscribeLoading] = React.useState(false);
  const [isUnsubscribeLoading, setIsUnsubscribeLoading] = React.useState(false);

  const run = async (action: () => Promise<SpaceKpisPage.MutationResult>, loading: (value: boolean) => void) => {
    loading(true);
    try {
      await action();
    } finally {
      loading(false);
    }
  };

  return (
    <CurrentSubscriptions
      subscribers={kpi.potentialSubscribers ?? []}
      subscribedPeople={subscribedPeople}
      isCurrentUserSubscribed={kpi.isSubscribed ?? false}
      resourceName="KPI"
      notifyWhen="a new update is logged on this KPI"
      canEditSubscribers={canEditKpiSubscribers}
      isSubscribeLoading={isSubscribeLoading}
      isUnsubscribeLoading={isUnsubscribeLoading}
      onSubscribe={() => run(() => kpiSubscriptions.onSubscribe({ subscriptionListId }), setIsSubscribeLoading)}
      onUnsubscribe={() => run(() => kpiSubscriptions.onUnsubscribe({ subscriptionListId }), setIsUnsubscribeLoading)}
      onEditSubscribers={(subscriberIds) =>
        kpiSubscriptions.onEditSubscribers({ subscriptionListId, subscriberIds })
      }
    />
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
