import { Goal } from "./index";
import { filterPossibleParentGoals } from "./filterPossibleParentGoals";

describe("filterPossibleParentGoals", () => {
  it("should return goals that are not descendants of the goal", () => {
    const goals = [
      { id: "1", parentGoalId: null },
      { id: "2", parentGoalId: "1" },
      { id: "3", parentGoalId: "2" },
      { id: "4", parentGoalId: null },
      { id: "5", parentGoalId: "4" },
      { id: "6", parentGoalId: "1" },
    ];
    const goal = { id: "2", parentGoalId: "1" };

    const result = filterPossibleParentGoals(goals as Goal[], goal as Goal);
    const ids = result.map((g) => g.id);

    expect(ids).toHaveLength(3);
    expect(ids).toContain("4");
    expect(ids).toContain("5");
    expect(ids).toContain("6");
  });
});
