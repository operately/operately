import * as Pages from "@/components/Pages";
import * as Groups from "@/models/groups";
import * as Companies from "@/models/companies";
import * as Discussions from "@/models/discussions";

interface LoadedData {
  company: Companies.Company;
  space: Groups.Group;
  discussions: Discussions.Discussion[];
}

export async function loader({ params }): Promise<LoadedData> {
  return {
    company: await Companies.getCompany(),
    space: await Groups.getGroup(params.id),
    discussions: await Discussions.getDiscussions({ spaceId: params.id }),
  };
}

export function useLoadedData(): LoadedData {
  return Pages.useLoadedData() as LoadedData;
}
