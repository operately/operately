import * as Goals from "@/models/goals";
import { loader } from "./loader";

jest.mock("@/models/goals", () => ({
  getGoal: jest.fn(),
}));

describe("GoalCheckInNewPage loader", () => {
  it("loads the last check-in for reference while writing a new one", async () => {
    (Goals.getGoal as jest.Mock).mockResolvedValue({ goal: { id: "goal-1" } });

    await loader({ params: { goalId: "goal-1" } });

    expect(Goals.getGoal).toHaveBeenCalledWith(
      expect.objectContaining({
        includeLastCheckIn: true,
      }),
    );
  });
});
