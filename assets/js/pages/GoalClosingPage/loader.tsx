import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";
import * as Projects from "@/models/projects";
import { Paths, compareIds } from "@/routes/paths";

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

export async function loader({ params }): Promise<LoaderResult> {
  const [goal, goals, projects] = await Promise.all([
    Goals.getGoal({ id: params.goalId }).then((data) => data.goal!),
    Goals.getGoals({}).then((data) => data.goals!),
    Projects.getProjects({}).then((data) => data.projects!),
  ]);

  return {
    goal: goal,
    activeSubitems: findActiveSubitems(goal, goals, projects),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}

function findActiveSubitems(goal: Goals.Goal, goals: Goals.Goal[], projects: Projects.Project[]): ActiveSubitem[] {
  const activeGoals = findSubgoals(goal.id!, goals);
  const activeProjects = findActiveProjects(projects, [...activeGoals, goal]);

  let res: ActiveSubitem[] = [];

  activeGoals.forEach((goal) => {
    res.push({
      id: goal.id!,
      name: goal.name!,
      type: "goal",
      link: Paths.goalPath(goal.id!),
    });
  });

  activeProjects.forEach((project) => {
    res.push({
      id: project.id!,
      name: project.name!,
      type: "project",
      link: Paths.projectPath(project.id!),
    });
  });

  return res;
}

function findSubgoals(parentId: string, goals: Goals.Goal[]): Goals.Goal[] {
  let res: Goals.Goal[] = [];

  goals.forEach((goal) => {
    if (compareIds(goal.parentGoalId, parentId)) {
      res.push(goal);
      res = res.concat(findSubgoals(goal.id!, goals));
    }
  });

  return res.filter((goal) => !goal.isClosed);
}

function findActiveProjects(projects: Projects.Project[], goals: Goals.Goal[]): Projects.Project[] {
  return projects.filter((project) => {
    return project.status !== "closed" && goals.some((goal) => compareIds(goal.id, project.goalId));
  });
}
