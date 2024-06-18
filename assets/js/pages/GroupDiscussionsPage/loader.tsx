import * as Pages from "@/components/Pages";
import * as Spaces from "@/models/spaces";
import * as Companies from "@/models/companies";
import * as Discussions from "@/models/discussions";

interface LoadedData {
  company: Companies.Company;
  space: Spaces.Space;
  discussions: Discussions.Discussion[];
}

export async function loader({ params }): Promise<LoadedData> {
  return {
    company: await Companies.getCompany(),
    space: await Spaces.getSpace(params.id),
    discussions: await Discussions.getDiscussions({ spaceId: params.id }),
  };
}

export function useLoadedData(): LoadedData {
  return Pages.useLoadedData() as LoadedData;
}
