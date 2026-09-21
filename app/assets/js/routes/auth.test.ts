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

describe("pending requests during authentication", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    Object.defineProperty(global, "document", { configurable: true, value: { querySelector: () => null } });
    global.fetch = jest.fn().mockResolvedValue({ status: 200 });
    queryClient.clear();
  });
  afterEach(() => {
    queryClient.clear();
    jest.useRealTimers();
    Reflect.deleteProperty(global, "document");
  });

  it.each(["login", "logout"])("does not cache late responses after %s", async (action) => {
    let finish: (value: string) => void = () => {};
    const oldRequest = queryClient
      .fetchQuery({
        queryKey: ["person"],
        queryFn: () =>
          new Promise<string>((resolve) => {
            finish = resolve;
          }),
      })
      .catch(() => undefined);
    if (action === "login") await logIn("new@example.com", "password", { skipRedirect: true });
    else await logOut();
    queryClient.setQueryData(["person"], "new session");
    finish("previous session");
    await oldRequest;
    expect(queryClient.getQueryData(["person"])).toBe("new session");
  });

  it("keeps sequential recovery in the new session without restoring a cancelled response", async () => {
    let finish: (value: string) => void = () => {};
    const first = queryClient.fetchQuery({
      queryKey: ["first"],
      queryFn: () =>
        new Promise<string>((resolve) => {
          finish = resolve;
        }),
    });
    const recovery = first.catch(() =>
      queryClient.fetchQuery({ queryKey: ["recovery"], queryFn: async () => "current session" }),
    );
    await logIn("new@example.com", "password", { skipRedirect: true });
    finish("old session");
    await recovery;
    expect(queryClient.getQueryData(["first"])).toBeUndefined();
    expect(queryClient.getQueryData(["recovery"])).toBe("current session");
  });
});
