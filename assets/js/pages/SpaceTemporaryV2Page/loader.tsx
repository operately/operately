import * as Pages from "@/components/Pages";
import * as Spaces from "@/models/spaces";
import * as Companies from "@/models/companies";
import * as Discussions from "@/models/discussions";
import * as Goals from "@/models/goals";
import * as Projects from "@/models/projects";

interface LoadedData {
  company: Companies.Company;
  space: Spaces.Space;
  discussions: Discussions.Discussion[];
  goals: Goals.Goal[];
  projects: Projects.Project[];
  loadedAt: Date;
}

export async function loader({ params }): Promise<LoadedData> {
  const [company, space, discussions, goals, projects] = await Promise.all([
    Companies.getCompany({ id: params.companyId }).then((d) => d.company!),
    Spaces.getSpace({
      id: params.id,
      includeMembers: true,
      includeAccessLevels: true,
      includeUnreadNotifications: true,
      includePermissions: true,
    }),
    Discussions.getDiscussions({
      spaceId: params.id,
      includeAuthor: true,
      includeCommentsCount: true,
    }).then((data) => data.discussions!),
    Goals.getGoals({ spaceId: params.id }).then((data) => data.goals!),
    Projects.getProjects({
      spaceId: params.id,
      includeLastCheckIn: true,
      includeMilestones: true,
    }).then((data) => data.projects!),
  ]);

  return {
    company,
    space,
    discussions,
    goals,
    projects,
    loadedAt: new Date(),
  };
}

export function useLoadedData(): LoadedData {
  return Pages.useLoadedData() as LoadedData;
}

export function useRefresh() {
  return Pages.useRefresh();
}
