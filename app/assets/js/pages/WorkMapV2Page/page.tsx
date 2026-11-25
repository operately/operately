import React from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import { builtInWorkMapView, mapColumns, ContentListSkeleton, WorkMapV2Page } from "turboui";

import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import { useSaveWorkMapDefaultView } from "@/models/workMap";
import { useOrganization } from "./useOrganization";
import { useCreation } from "./useCreation";
import { useReviewerEditing } from "./useReviewerEditing";
import { usePaths } from "@/routes/paths";
import { useCompanyLoaderData } from "@/routes/useCompanyLoaderData";
import { readView, writeView, clearViewParams } from "./viewParams";
import { readFilters } from "./filters";
import { useLoadedData } from "./loader";

export function Page() {
  const data = useLoadedData();
  if (!data) return <ContentListSkeleton />;
  return <ReadyPage key={data.space?.id ?? "company"} data={data} />;
}

function ReadyPage({ data }: { data: NonNullable<ReturnType<typeof useLoadedData>> }) {
  const { t } = useTranslation();
  const paths = usePaths();
  const { company } = useCompanyLoaderData();
  const [search, setSearch] = useSearchParams();
  const formattedTimePreferences = useFormattedTimePreferences();
  const defaultView = useSaveWorkMapDefaultView();

  const { workMap, space, settings, settingsInput } = data;

  const organization = useOrganization(settings, settingsInput);
  const reviewerEditing = useReviewerEditing(settings.reviewerEditableItemIds);
  const creation = useCreation(workMap, company, space);
  const builtIn = builtInWorkMapView(Boolean(space));
  const defaults = { ...builtIn, ...settings.defaultView };
  defaults.columns = mapColumns.filter((c) => c === "name" || defaults.columns.includes(c));
  const view = readView(search, defaults, readFilters(search));

  return (
    <WorkMapV2Page
      title={space ? t("Work Map") : t("{{company}} Work Map", { company: company.name })}
      space={space ? { id: space.id, name: space.name, href: paths.spacePath(space.id) } : undefined}
      items={workMap}
      creation={creation}
      reviewerEditing={reviewerEditing}
      organization={organization}
      view={view}
      onViewChange={(next) => {
        const params = writeView(search, next, defaults);
        if (params.toString() !== search.toString()) setSearch(params);
      }}
      adjusted={writeView(new URLSearchParams(), view, defaults).size > 0}
      onReset={() => setSearch(clearViewParams(search))}
      scopeName={space?.name ?? company.name}
      orderedItemIds={settings.orderedItemIds}
      saving={defaultView.saving}
      onSaveDefault={settings.canEdit ? () => defaultView.save(settingsInput, view) : undefined}
      formattedTimePreferences={formattedTimePreferences}
    />
  );
}
