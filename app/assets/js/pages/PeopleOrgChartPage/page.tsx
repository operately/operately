import * as Pages from "@/components/Pages";
import React from "react";
import { useTranslation } from "react-i18next";
import { PeopleOrgChartPage } from "turboui";
import { compareIds, usePaths } from "@/routes/paths";
import { useLoadedData } from "./loader";
import { useOrgChart } from "./useOrgChart";

export function Page() {
  const { t } = useTranslation();
  const { people } = useLoadedData();
  const paths = usePaths();
  const chart = useOrgChart(people);

  return (
    <Pages.Page title={t("Org Chart")}>
      <PeopleOrgChartPage chart={chart} profileHref={(id) => paths.profilePath(id)} idsMatch={compareIds} />
    </Pages.Page>
  );
}
