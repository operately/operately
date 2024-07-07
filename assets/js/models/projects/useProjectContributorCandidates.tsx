import * as api from "@/api";

export function useProjectContributorCandidates(id: string): (query: string) => Promise<api.Person[]> {
  return async (query: string) => {
    return await api.searchProjectContributorCandidates({ projectId: id, query: query }).then((r) => r.people!);
  };
}
