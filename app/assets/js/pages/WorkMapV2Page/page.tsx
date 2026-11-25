import React from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import { ContentListSkeleton, WorkMapV2Page } from "turboui";

import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import { usePaths } from "@/routes/paths";
import { useCompanyLoaderData } from "@/routes/useCompanyLoaderData";
import { readFilters, writeFilters } from "./filters";
import { useLoadedData } from "./loader";

export function Page() {
  const { t } = useTranslation();
  const paths = usePaths();
  const { company } = useCompanyLoaderData();
  const [search, setSearch] = useSearchParams();
  const formattedTimePreferences = useFormattedTimePreferences();
  const data = useLoadedData();

  if (!data) return <ContentListSkeleton />;
  const { workMap, space } = data;

  return (
    <WorkMapV2Page
      title={space ? t("Work Map") : t("{{company}} Work Map", { company: company.name })}
      space={space ? { name: space.name, href: paths.spacePath(space.id) } : undefined}
      items={workMap}
      filters={readFilters(search)}
      onFiltersChange={(filters) => setSearch(writeFilters(search, filters))}
      formattedTimePreferences={formattedTimePreferences}
    />
  );
}
