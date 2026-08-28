import Api, { type ProjectTemplate, type ProjectTemplateMilestone } from "@/api";
import { compareIds, Paths } from "@/routes/paths";
import { redirect } from "react-router";

export interface LoadedData {
  template: ProjectTemplate;
  milestone: ProjectTemplateMilestone;
}

export async function loader({ params }): Promise<LoadedData> {
  const { template } = await Api.project_templates.get({ id: params.templateId });
  const milestone = (template.milestones ?? []).find((item) => compareIds(item.id, params.id));

  if (!milestone) {
    throw redirect(new Paths({ companyId: params.companyId }).projectTemplatePath(params.templateId));
  }

  return { template, milestone };
}
