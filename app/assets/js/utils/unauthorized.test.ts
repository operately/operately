import { isUnauthorizedError, loginPath } from "./unauthorized";

function stubLocation(pathname: string) {
  Object.defineProperty(global, "window", {
    configurable: true,
    value: {
      location: { pathname, assign: jest.fn() },
    },
  });
}

function axiosError(status: number) {
  return {
    isAxiosError: true,
    response: { status },
  };
}

describe("isUnauthorizedError", () => {
  it("is true for axios 401 errors", () => {
    expect(isUnauthorizedError(axiosError(401))).toBe(true);
  });

  it.each([403, 404, 500])("is false for axios %s errors", (status) => {
    expect(isUnauthorizedError(axiosError(status))).toBe(false);
  });

  it("is false for non-axios errors", () => {
    expect(isUnauthorizedError(new Error("nope"))).toBe(false);
  });
});

describe("loginPath", () => {
  it("returns /log_in on the home page", () => {
    stubLocation("/");

    expect(loginPath()).toBe("/log_in");
  });

  it("includes redirect_to for nested paths", () => {
    stubLocation("/semaphore-0bef/projects/semabot");

    expect(loginPath()).toBe("/log_in?redirect_to=%2Fsemaphore-0bef%2Fprojects%2Fsemabot");
  });
});
