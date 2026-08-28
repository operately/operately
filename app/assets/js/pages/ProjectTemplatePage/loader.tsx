import Api, { type ProjectTemplate } from "@/api";

export interface LoadedData {
  template: ProjectTemplate;
}

export async function loader({ params }): Promise<LoadedData> {
  return Api.project_templates.get({ id: params.id });
}
