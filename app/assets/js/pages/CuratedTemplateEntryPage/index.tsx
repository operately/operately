import React from "react";
import { PageModule } from "@/routes/types";
import { Paths } from "@/routes/paths";
import { CuratedTemplateCompanyPicker } from "turboui";
import { loader, useLoadedData } from "./loader";

function Page() {
  const { template, templateId, companies } = useLoadedData();

  return (
    <CuratedTemplateCompanyPicker
      title={template.title}
      companies={companies}
      companyPath={(companyId) => new Paths({ companyId }).curatedTemplateUsePath(templateId)}
    />
  );
}

export default { name: "CuratedTemplateEntryPage", loader, Page } as PageModule;
