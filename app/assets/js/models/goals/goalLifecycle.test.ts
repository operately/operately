import Api from "@/api";
import { QueryClient } from "@tanstack/react-query";
import { invalidateGoalRetrospectiveQueries } from "./goalLifecycle";

describe("goal lifecycle queries", () => {
  beforeAll(() => {
    Api.default.setBasePath("/api/v2");
    Api.default.setHeaders({ "x-company-id": "company-1" });
  });

  it("invalidates activity and goal detail queries after acknowledging a retrospective", async () => {
    const queryClient = createQueryClient();
    const activityKey = Api.companies.getActivityQueryKey({ id: "activity-1" });
    const goalKey = Api.goals.getQueryKey({ id: "goal-1" });
    const listGoalsKey = Api.goals.listQueryKey({});

    [activityKey, goalKey, listGoalsKey].forEach((queryKey) => queryClient.setQueryData(queryKey, {}));

    await invalidateGoalRetrospectiveQueries(queryClient);

    expect(queryClient.getQueryState(activityKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(goalKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(listGoalsKey)?.isInvalidated).toBe(false);
  });
});

function createQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}
