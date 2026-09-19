import { queryClient } from "@/api/queryClient";
import { logIn, logOut } from "./auth";

describe("authentication cache isolation", () => {
  beforeEach(() => {
    Object.defineProperty(global, "document", {
      configurable: true,
      value: { querySelector: jest.fn(() => null) },
    });

    global.fetch = jest.fn();
    queryClient.clear();
    queryClient.setQueryData(["company-layout", "previous-account"], { company: "private" });
    jest.spyOn(queryClient, "clear");
  });

  afterEach(() => {
    jest.restoreAllMocks();
    queryClient.clear();
    Reflect.deleteProperty(global, "document");
  });

  it("clears cached queries after a successful login", async () => {
    jest.mocked(global.fetch).mockResolvedValue({ status: 200 } as Response);

    await expect(logIn("user@example.com", "password", { skipRedirect: true })).resolves.toBe("success");

    expect(queryClient.clear).toHaveBeenCalledTimes(1);
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });

  it("clears cached queries after a successful logout", async () => {
    jest.mocked(global.fetch).mockResolvedValue({ status: 200 } as Response);

    await expect(logOut()).resolves.toBe("success");

    expect(queryClient.clear).toHaveBeenCalledTimes(1);
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });

  it("preserves cached queries when authentication fails", async () => {
    jest.mocked(global.fetch).mockResolvedValue({ status: 401 } as Response);

    await expect(logIn("user@example.com", "wrong password", { skipRedirect: true })).resolves.toBe("failure");
    await expect(logOut()).resolves.toBe("failure");

    expect(queryClient.clear).not.toHaveBeenCalled();
    expect(queryClient.getQueryData(["company-layout", "previous-account"])).toEqual({ company: "private" });
  });
});
