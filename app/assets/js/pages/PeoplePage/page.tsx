import * as Pages from "@/components/Pages";
import React from "react";
import { useTranslation } from "react-i18next";
import { PeoplePage } from "turboui";
import { usePaths } from "@/routes/paths";
import { useLoadedData } from "./loader";

export function Page() {
  const { t } = useTranslation();
  const { company, people } = useLoadedData();
  const paths = usePaths();

  return (
    <Pages.Page title={t("People")}>
      <PeoplePage companyName={company.name} people={people} profileHref={(id) => paths.profilePath(id)} />
    </Pages.Page>
  );
}
