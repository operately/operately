import * as Pages from "@/components/Pages";
import * as Companies from "@/models/companies";
import * as Groups from "@/models/groups";
import * as Tasks from "@/models/tasks";

interface LoaderResult {
  company: Companies.Company;
  group: Groups.Group;
  tasks: Tasks.Task[];
}

export async function loader({ request, params }): Promise<LoaderResult> {
  const searchParams = new URL(request.url).searchParams;
  const status = searchParams.get("status") || "open";

  return {
    company: await Companies.getCompany(),
    group: await Groups.getGroup(params.id),
    tasks: await Tasks.getTasks(params.id, status),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}

export function useRefresh() {
  return Pages.useRefresh();
}
