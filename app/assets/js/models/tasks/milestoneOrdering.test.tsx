import { TaskBoard } from "turboui";
import { buildMilestonesOrderingState } from "./milestoneOrdering";

describe("buildMilestonesOrderingState", () => {
  test("should handle moving task from one milestone to another", () => {
    // Create milestones with ordering states
    const milestones = [
      createMilestone("milestone-1", ["task-1", "task-2"]),
      createMilestone("milestone-2", ["task-3"]),
    ];
    
    // Create the task being moved
    const task = createTask("task-1", "milestone-1");

    const result = buildMilestonesOrderingState(
      milestones,
      task,
      "milestone-2",
      1
    );

    // Should update both source and target milestone ordering states
    expect(result).toHaveLength(2);
    
    // Source milestone should only have task-2
    expect(result[0]).toEqual({
      milestoneId: "milestone-1",
      orderingState: ["task-2"]
    });
    
    // Target milestone should have task-3 and task-1 (inserted at index 1)
    expect(result[1]).toEqual({
      milestoneId: "milestone-2",
      orderingState: ["task-3", "task-1"]
    });
  });

  test("should handle moving task within the same milestone", () => {
    // Create milestones with ordering states
    const milestones = [
      createMilestone("milestone-1", ["task-1", "task-2", "task-3"]),
    ];
    
    // Create the task being moved
    const task = createTask("task-1", "milestone-1");

    const result = buildMilestonesOrderingState(
      milestones,
      task,
      "milestone-1",
      2
    );

    // Should update only one milestone
    expect(result).toHaveLength(1);
    
    // Milestone should have task-2, task-3, task-1 (task-1 moved to end)
    expect(result[0]).toEqual({
      milestoneId: "milestone-1",
      orderingState: ["task-2", "task-3", "task-1"]
    });
  });

  test("should handle moving task to no-milestone", () => {
    // Create milestones with ordering states
    const milestones = [
      createMilestone("milestone-1", ["task-1", "task-2"]),
    ];
    
    // Create the task being moved
    const task = createTask("task-1", "milestone-1");

    const result = buildMilestonesOrderingState(
      milestones,
      task,
      "no-milestone",
      0
    );

    // Should only update source milestone
    expect(result).toHaveLength(1);
    
    // Source milestone should only have task-2
    expect(result[0]).toEqual({
      milestoneId: "milestone-1",
      orderingState: ["task-2"]
    });
  });

  test("should handle moving task from no-milestone to a milestone", () => {
    // Create milestones with ordering states
    const milestones = [
      createMilestone("milestone-1", ["task-2"]),
    ];
    
    // Create the task being moved (with no milestone)
    const task = createTask("task-1", null);

    const result = buildMilestonesOrderingState(
      milestones,
      task,
      "milestone-1",
      1
    );

    // Should only update target milestone
    expect(result).toHaveLength(1);
    
    // Target milestone should have task-2 and task-1
    expect(result[0]).toEqual({
      milestoneId: "milestone-1",
      orderingState: ["task-2", "task-1"]
    });
  });
});

const createTask = (id: string, milestoneId: string | null): TaskBoard.Task => ({
    id,
    title: `Task ${id}`,
    status: null,
    description: null,
    link: "",
    assignees: [],
    milestone: milestoneId ? { 
      id: milestoneId, 
      name: `Milestone ${milestoneId}`,
      status: "pending" as const, 
      dueDate: null, 
      link: "#",
      tasksOrderingState: []
    } : null,
    dueDate: null,
    hasDescription: false,
    hasComments: false,
    commentCount: 0,
    comments: undefined,
    type: "project",
    _isHelperTask: false,
  });

const createMilestone = (id: string, taskIds: string[]): TaskBoard.Milestone => ({
    id, 
    name: `Milestone ${id}`,
    status: "pending" as const, 
    dueDate: null, 
    link: "#",
    tasksOrderingState: taskIds
  });