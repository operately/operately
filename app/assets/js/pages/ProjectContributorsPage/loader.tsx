import * as Pages from "@/components/Pages";
import * as Projects from "@/models/projects";
import * as ProjectContributors from "@/models/projectContributors";
import * as People from "@/models/people";

import { useGetBindedPeople } from "@/api";
import { compareIds } from "@/routes/paths";

interface LoaderData {
  project: Projects.Project;
  champion: Projects.ProjectContributor | null;
  reviewer: Projects.ProjectContributor | null;
  contributors: Projects.ProjectContributor[];
}

export async function loader({ params }): Promise<LoaderData> {
  const project = await Projects.getProject({
    id: params.projectID,
    includePermissions: true,
    includeContributors: true,
    includeAccessLevels: true,
    includeContributorsAccessLevels: true,
  }).then((data) => data.project!);

  const { champion, reviewer, contributors } = ProjectContributors.splitByRole(project.contributors!);

  return {
    project: project,
    champion: champion,
    reviewer: reviewer,
    contributors: contributors,
  };
}

export function useLoadedData(): LoaderData {
  return Pages.useLoadedData() as LoaderData;
}

export function useBindedPeopleList(): { people: People.Person[] | undefined; loading: boolean } {
  const { champion, reviewer, contributors, project } = useLoadedData();
  const { data, loading } = useGetBindedPeople({ resourseType: "project", resourseId: project.id! });

  if (loading) return { people: undefined, loading: true };

  const championId = champion?.person?.id;
  const reviewerId = reviewer?.person?.id;
  const contributorIds = contributors!.map((c) => c.person?.id);
  const assignedIds = [championId, reviewerId, ...contributorIds];

  const people = data?.people!.filter((p) => !assignedIds.some((id) => compareIds(id, p.id)));

  return { people, loading: false };
}
