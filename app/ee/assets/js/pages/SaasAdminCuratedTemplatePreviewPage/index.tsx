import React from "react";
import { CuratedTemplatePreviewPage, getTemplatePreviewReferenceDate } from "turboui";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import { curatedTemplatePath } from "@/ee/models/curatedTemplateLifecycle";
import { assertPresent } from "@/utils/assertions";
import { useLoadedData } from "../SaasAdminCuratedTemplatePage/loader";

export { loader } from "../SaasAdminCuratedTemplatePage/loader";

export function Page() {
  const { template } = useLoadedData();
  const preferences = useFormattedTimePreferences();
  const [referenceDate] = React.useState(() => getTemplatePreviewReferenceDate(new Date(), preferences.timezone));
  assertPresent(template, "Template is required for preview");

  return (
    <CuratedTemplatePreviewPage
      template={template}
      templatePath={curatedTemplatePath(template.id)}
      referenceDate={referenceDate}
      formattedTimePreferences={preferences}
    />
  );
}
