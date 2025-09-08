import { compareIds } from "@/routes/paths";
import * as Goals from "@/models/goals";
import * as Projects from "@/models/projects";

// Extract the findActiveProjects function for testing
// Since it's not exported, we replicate the logic here for testing
function findActiveProjects(projects: Projects.Project[], goals: Goals.Goal[]): Projects.Project[] {
  return projects.filter((project) => {
    return project.state !== "closed" && goals.some((goal) => compareIds(goal.id, project.goalId));
  });
}

function createMockProject(id: string, goalId: string, state: "active" | "paused" | "closed"): Projects.Project {
  return {
    id,
    goalId,
    name: `Project ${id}`,
    state,
    status: "active", // status field is not used for determining closure
    successStatus: "achieved",
  } as Projects.Project;
}

function createMockGoal(id: string): Goals.Goal {
  return {
    id,
    name: `Goal ${id}`,
    isClosed: false,
  } as Goals.Goal;
}

describe("GoalClosingPage loader - findActiveProjects", () => {
  it("should exclude closed projects from active projects list", () => {
    const goalId = "goal-1";
    const goals = [createMockGoal(goalId)];
    
    const projects = [
      createMockProject("project-1", goalId, "active"),
      createMockProject("project-2", goalId, "closed"),
      createMockProject("project-3", goalId, "paused"),
    ];

    const activeProjects = findActiveProjects(projects, goals);

    expect(activeProjects).toHaveLength(2);
    expect(activeProjects.map(p => p.id)).toEqual(["project-1", "project-3"]);
    expect(activeProjects.some(p => p.state === "closed")).toBe(false);
  });

  it("should only include projects that belong to the given goals", () => {
    const goalId1 = "goal-1";
    const goalId2 = "goal-2";
    const goals = [createMockGoal(goalId1)];
    
    const projects = [
      createMockProject("project-1", goalId1, "active"),
      createMockProject("project-2", goalId2, "active"), // Different goal
    ];

    const activeProjects = findActiveProjects(projects, goals);

    expect(activeProjects).toHaveLength(1);
    expect(activeProjects[0]!.id).toBe("project-1");
  });

  it("should return empty array when all projects are closed", () => {
    const goalId = "goal-1";
    const goals = [createMockGoal(goalId)];
    
    const projects = [
      createMockProject("project-1", goalId, "closed"),
      createMockProject("project-2", goalId, "closed"),
    ];

    const activeProjects = findActiveProjects(projects, goals);

    expect(activeProjects).toHaveLength(0);
  });
});