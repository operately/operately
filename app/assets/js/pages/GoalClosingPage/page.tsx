import { Trans } from "turboui";
import { useTranslation } from "react-i18next";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as React from "react";

import { ActiveSubitemsWarning } from "./ActiveSubitemsWarning";

import { Form } from "./Form";
import { useLoadedData } from "./loader";

import { usePaths } from "@/routes/paths";
export function Page() {
  const { t } = useTranslation();
  const { goal } = useLoadedData();

  return (
    <Pages.Page title={t("Closing {{name}}", { name: goal.name })} testId="goal-closing-page">
      <Paper.Root>
        <Navigation />

        <Paper.Body minHeight="none">
          <PageTitle />
          <ActiveSubitemsWarning />
          <Form />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Navigation() {
  const paths = usePaths();
  const { goal } = useLoadedData();

  return <Paper.Navigation items={[{ to: paths.goalPath(goal.id!), label: goal.name! }]} />;
}

function PageTitle() {
  return (
    <div className="mb-6 text-content-accent text-2xl font-extrabold">
      <Trans i18nKey="Review & Close Goal" />
    </div>
  );
}
