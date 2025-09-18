import { parseActivitiesForTurboUi } from "../feed";
import { Activity, ActivityContentTaskMilestoneUpdating } from "@/api";
import { Paths } from "@/routes/paths";

// Mock the dependencies
jest.mock("../people", () => ({
  parsePersonForTurboUi: jest.fn(() => ({
    id: "person-1",
    fullName: "John Doe",
    avatarUrl: null,
  })),
}));

jest.mock("@/routes/paths", () => ({
  compareIds: jest.fn((a, b) => a === b),
}));

jest.mock("../milestones", () => ({
  parseMilestoneForTurboUi: jest.fn((paths, milestone) => ({
    id: milestone.id,
    name: milestone.title,
    status: milestone.status,
  })),
}));

describe("parseActivitiesForTurboUi", () => {
  const mockPaths = {} as Paths;
  const pageContext = "task" as const;

  const createMockActivity = (content: ActivityContentTaskMilestoneUpdating): Activity => ({
    id: "activity-1",
    action: "task_milestone_updating",
    insertedAt: "2023-01-01T00:00:00Z",
    author: {
      id: "person-1",
      fullName: "John Doe",
      avatarUrl: null,
    },
    content,
  });

  describe("task milestone updating activities", () => {
    it("should handle when both milestones are null (deleted)", () => {
      const content: ActivityContentTaskMilestoneUpdating = {
        project: { id: "project-1", name: "Test Project" },
        task: { id: "task-1", name: "Test Task" },
        oldMilestone: null,
        newMilestone: null,
      };

      const activity = createMockActivity(content);
      const result = parseActivitiesForTurboUi(mockPaths, [activity], pageContext);

      // Should return empty array as the activity cannot be displayed
      expect(result).toEqual([]);
    });

    it("should handle when old milestone is null but new milestone exists", () => {
      const newMilestone = {
        id: "milestone-2",
        title: "New Milestone",
        status: "pending",
      };

      const content: ActivityContentTaskMilestoneUpdating = {
        project: { id: "project-1", name: "Test Project" },
        task: { id: "task-1", name: "Test Task" },
        oldMilestone: null,
        newMilestone,
      };

      const activity = createMockActivity(content);
      const result = parseActivitiesForTurboUi(mockPaths, [activity], pageContext);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: "activity-1",
        type: "task_milestone_updating",
        action: "attached",
        taskName: "Test Task",
      });
    });

    it("should handle when new milestone is null but old milestone exists", () => {
      const oldMilestone = {
        id: "milestone-1",
        title: "Old Milestone",
        status: "pending",
      };

      const content: ActivityContentTaskMilestoneUpdating = {
        project: { id: "project-1", name: "Test Project" },
        task: { id: "task-1", name: "Test Task" },
        oldMilestone,
        newMilestone: null,
      };

      const activity = createMockActivity(content);
      const result = parseActivitiesForTurboUi(mockPaths, [activity], pageContext);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: "activity-1",
        type: "task_milestone_updating",
        action: "detached",
        taskName: "Test Task",
      });
    });

    it("should return null when both milestones have the same ID", () => {
      const milestone = {
        id: "milestone-1",
        title: "Same Milestone",
        status: "pending",
      };

      const content: ActivityContentTaskMilestoneUpdating = {
        project: { id: "project-1", name: "Test Project" },
        task: { id: "task-1", name: "Test Task" },
        oldMilestone: milestone,
        newMilestone: milestone,
      };

      const activity = createMockActivity(content);
      const result = parseActivitiesForTurboUi(mockPaths, [activity], pageContext);

      // Should return empty array as no change occurred
      expect(result).toEqual([]);
    });
  });
});