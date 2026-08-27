import { showErrorToast } from "turboui";

import Api from "@/api";

import { usePersonFieldSearch } from "./usePersonFieldSearch";

jest.mock("@/api", () => ({
  __esModule: true,
  default: {
    people: {
      search: jest.fn(),
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

describe("usePersonFieldSearch", () => {
  beforeEach(() => {
    jest.mocked(Api.people.search).mockReset();
    jest.mocked(showErrorToast).mockReset();
  });

  it.each([401, 500])("shows a toast and does not reject when the search API returns %s", async (status) => {
    jest.mocked(Api.people.search).mockRejectedValue(axiosError(status));

    const { onSearch } = usePersonFieldSearch({ scope: { type: "company" } });

    await expect(onSearch("")).resolves.toBeUndefined();
    expect(showErrorToast).toHaveBeenCalledWith("Couldn't load people", "Please try again.");
  });
});
