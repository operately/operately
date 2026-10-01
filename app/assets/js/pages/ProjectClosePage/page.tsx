import { Trans } from "turboui";
import { useTranslation } from "react-i18next";
import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";

import { useLoadedData } from "./loader";
import { Form } from "@/features/ProjectRetrospective";
import { ProjectPageNavigation } from "@/components/ProjectPageNavigation";

export function Page() {
  const { t } = useTranslation();
  const { project } = useLoadedData();

  return (
    <Pages.Page title={t("Closing {{name}}", { name: project.name })}>
      <Paper.Root>
        <ProjectPageNavigation project={project} />
        <Paper.Body minHeight="none">
          <div className="mb-6 text-content-accent text-2xl font-extrabold">
            <Trans i18nKey="Review & Close Project" />
          </div>

          <Form mode="create" project={project} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
