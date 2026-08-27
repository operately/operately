import { showErrorToast } from "turboui";

import Api from "@/api";

import { useTaskAssigneeSearch } from "./useTaskAssigneeSearch";

jest.mock("@/api", () => ({
  __esModule: true,
  default: {
    tasks: {
      listPotentialAssignees: jest.fn(),
    },
  },
}));

jest.mock("turboui", () => ({
  showErrorToast: jest.fn(),
}));

jest.mock("react", () => ({
  useState: (initial: unknown) => [initial, jest.fn()],
  useCallback: (fn: unknown) => fn,
  useEffect: () => undefined,
}));

function axiosError(status: number) {
  return {
    isAxiosError: true,
    response: { status },
  };
}

describe("useTaskAssigneeSearch", () => {
  beforeEach(() => {
    jest.mocked(Api.tasks.listPotentialAssignees).mockReset();
    jest.mocked(showErrorToast).mockReset();
  });

  it.each([401, 500])("shows a toast and does not reject when the search API returns %s", async (status) => {
    jest.mocked(Api.tasks.listPotentialAssignees).mockRejectedValue(axiosError(status));

    const { onSearch } = useTaskAssigneeSearch({ id: "project-1", type: "project" });

    await expect(onSearch("")).resolves.toBeUndefined();
    expect(showErrorToast).toHaveBeenCalledWith("Couldn't load people", "Please try again.");
  });
});
