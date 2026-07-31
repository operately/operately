import * as React from "react";

import * as AdminApi from "@/ee/admin_api";
import * as Pages from "@/components/Pages";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import { SearchIndexAdminPage, showSuccessToast } from "turboui";
import type { MaintenanceKind, SearchIndexSourceStatus, StartMaintenanceResult } from "turboui";

interface LoaderResult {
  sources: AdminApi.SearchIndexSourceStatus[];
}

type StartMaintenance = (
  input: AdminApi.StartSearchIndexMaintenanceInput,
) => Promise<AdminApi.StartSearchIndexMaintenanceResult>;

export async function loader(): Promise<LoaderResult> {
  const response = await AdminApi.getSearchIndexStatus({});
  return { sources: response.sources };
}

export function Page() {
  const { sources } = Pages.useLoadedData<LoaderResult>();
  const refresh = Pages.useRefresh();
  const formattedTimePreferences = useFormattedTimePreferences();
  const [startMaintenance] = AdminApi.useStartSearchIndexMaintenance();

  React.useEffect(() => scheduleActiveRunRefresh(sources, refresh), [sources, refresh]);

  const handleStartMaintenance = async (
    kind: MaintenanceKind,
    sourceType?: string,
  ): Promise<StartMaintenanceResult> => {
    const registeredSourceType = resolveSourceType(sources, sourceType);
    return startMaintenanceAndRefresh(startMaintenance, refresh, kind, registeredSourceType);
  };

  return (
    <Pages.Page title="Search index" testId="saas-admin-search-index-page">
      <SearchIndexAdminPage
        sources={sources}
        formattedTimePreferences={formattedTimePreferences}
        onStartMaintenance={handleStartMaintenance}
      />
    </Pages.Page>
  );
}

export function scheduleActiveRunRefresh(sources: SearchIndexSourceStatus[], refresh: () => void): () => void {
  if (!sources.some((source) => source.latestRun?.status === "pending" || source.latestRun?.status === "running")) {
    return () => undefined;
  }

  const interval = setInterval(refresh, 5_000);
  return () => clearInterval(interval);
}

export async function startMaintenanceAndRefresh(
  startMaintenance: StartMaintenance,
  refresh: () => void,
  kind: MaintenanceKind,
  sourceType?: AdminApi.SearchIndexSourceType,
): Promise<StartMaintenanceResult> {
  const result = await startMaintenance({ kind, sourceType });
  refresh();

  const count = result.startedSourceTypes.length;
  const skipped = result.alreadyRunningSourceTypes.length;
  const description = skipped > 0 ? `${count} started. ${skipped} already running.` : `${count} started.`;
  showSuccessToast("Search index maintenance started", description);

  return result;
}

export function resolveSourceType(
  sources: AdminApi.SearchIndexSourceStatus[],
  sourceType?: string,
): AdminApi.SearchIndexSourceType | undefined {
  if (!sourceType) return undefined;

  const source = sources.find((source) => source.sourceType === sourceType);
  if (!source) throw new Error(`Unknown search index source type: ${sourceType}`);

  return source.sourceType;
}
