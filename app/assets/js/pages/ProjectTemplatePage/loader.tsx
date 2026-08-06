import Api, { type ProjectTemplate } from "@/api";
import { Paths } from "@/routes/paths";
import { redirectIfFeatureNotEnabled } from "@/routes/redirectUtils";

export interface LoadedData {
  template: ProjectTemplate;
}

export async function loader({ params }): Promise<LoadedData> {
  await redirectIfFeatureNotEnabled(params, {
    feature: "project_templates",
    path: Paths.companyHomePath(params.companyId),
  });

  return Api.project_templates.get({ id: params.id });
}
