import { useTranslation } from "react-i18next";
import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { ProjectRetrospectiveNavigation } from "@/components/ProjectPageNavigation";
import { Form } from "@/features/ProjectRetrospective";
import { useLoadedData } from "./loader";
import { assertPresent } from "@/utils/assertions";

export function Page() {
  const { t } = useTranslation();
  const { retrospective } = useLoadedData();
  assertPresent(retrospective.project, "project must be present in retrospective");

  return (
    <Pages.Page title={t("Editing Retrospective")}>
      <Paper.Root>
        <ProjectRetrospectiveNavigation project={retrospective.project} />
        <Paper.Body minHeight="none">
          <div className="text-content-accent text-3xl font-extrabold mb-8">{t("Editing Project Retrospective")}</div>

          <Form mode="edit" project={retrospective.project} retrospective={retrospective} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
