import { queryClient } from "@/api/queryClient";
import { logIn, logOut } from "./auth";

describe("authentication cache isolation", () => {
  beforeEach(() => {
    Object.defineProperty(global, "document", {
      configurable: true,
      value: { querySelector: jest.fn(() => null) },
    });

    global.fetch = jest.fn();
    jest.spyOn(queryClient, "clear").mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    Reflect.deleteProperty(global, "document");
  });

  it("clears cached queries after a successful login", async () => {
    jest.mocked(global.fetch).mockResolvedValue({ status: 200 } as Response);

    await expect(logIn("user@example.com", "password", { skipRedirect: true })).resolves.toBe("success");

    expect(queryClient.clear).toHaveBeenCalledTimes(1);
  });

  it("clears cached queries after a successful logout", async () => {
    jest.mocked(global.fetch).mockResolvedValue({ status: 200 } as Response);

    await expect(logOut()).resolves.toBe("success");

    expect(queryClient.clear).toHaveBeenCalledTimes(1);
  });

  it("preserves cached queries when authentication fails", async () => {
    jest.mocked(global.fetch).mockResolvedValue({ status: 401 } as Response);

    await expect(logIn("user@example.com", "wrong password", { skipRedirect: true })).resolves.toBe("failure");
    await expect(logOut()).resolves.toBe("failure");

    expect(queryClient.clear).not.toHaveBeenCalled();
  });
});
