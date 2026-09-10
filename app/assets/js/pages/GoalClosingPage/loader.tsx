import Api from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";
import * as Projects from "@/models/projects";
import { compareIds, Paths } from "@/routes/paths";

interface LoaderResult {
  goal: Goals.Goal;
  activeSubitems: ActiveSubitem[];
}

export interface ActiveSubitem {
  id: string;
  name: string;
  link: string;
  type: "goal" | "project";
}

export async function loader({ params }) {
  const queryInput = {
    id: params.goalId,
    includeSpace: true,
    includeChampion: true,
    includeReviewer: true,
    includePotentialSubscribers: true,
  };
  const goalsInput = {};
  const projectsInput = {};

  await Promise.all([
    Api.goals.getQuery(queryInput),
    Api.goals.listQuery(goalsInput),
    Api.projects.listQuery(projectsInput),
  ]);

  return { queryInput, goalsInput, projectsInput, companyId: params.companyId };
}

type LoaderInputs = Awaited<ReturnType<typeof loader>>;

export function useLoadedData(): LoaderResult {
  const { queryInput, goalsInput, projectsInput, companyId } = Pages.useLoadedData<LoaderInputs>();
  const { data: goalData } = useLoadedQuery(Api.goals.getQueryOptions(queryInput));
  const { data: goalsData } = useLoadedQuery(Api.goals.listQueryOptions(goalsInput));
  const { data: projectsData } = useLoadedQuery(Api.projects.listQueryOptions(projectsInput));

  if (!goalData?.goal) {
    throw new Error(`Goal data is unavailable for goal "${queryInput.id}"`);
  }
  if (!goalsData?.goals) {
    throw new Error("Goal list is unavailable");
  }
  if (!projectsData?.projects) {
    throw new Error("Project list is unavailable");
  }

  return {
    goal: goalData.goal,
    activeSubitems: findActiveSubitems(new Paths({ companyId }), goalData.goal, goalsData.goals, projectsData.projects),
  };
}

function findActiveSubitems(
  paths: Paths,
  goal: Goals.Goal,
  goals: Goals.Goal[],
  projects: Projects.Project[],
): ActiveSubitem[] {
  const activeGoals = findSubgoals(goal.id, goals);
  const activeProjects = findActiveProjects(projects, [...activeGoals, goal]);

  let res: ActiveSubitem[] = [];

  activeGoals.forEach((goal) => {
    res.push({
      id: goal.id,
      name: goal.name,
      type: "goal",
      link: paths.goalPath(goal.id),
    });
  });

  activeProjects.forEach((project) => {
    res.push({
      id: project.id,
      name: project.name,
      type: "project",
      link: paths.projectPath(project.id),
    });
  });

  return res;
}

function findSubgoals(parentId: string, goals: Goals.Goal[]): Goals.Goal[] {
  let res: Goals.Goal[] = [];

  goals.forEach((goal) => {
    if (compareIds(goal.parentGoalId, parentId)) {
      res.push(goal);
      res = res.concat(findSubgoals(goal.id, goals));
    }
  });

  return res.filter((goal) => !goal.isClosed);
}

function findActiveProjects(projects: Projects.Project[], goals: Goals.Goal[]): Projects.Project[] {
  return projects.filter((project) => {
    return project.state !== "closed" && goals.some((goal) => compareIds(goal.id, project.goalId));
  });
}
