import * as Sentry from "@sentry/react";

import { configureSentryUser } from "./sentryContext";

jest.mock("@sentry/react", () => ({
  setUser: jest.fn(),
}));

describe("configureSentryUser", () => {
  beforeEach(() => {
    jest.mocked(Sentry.setUser).mockReset();
  });

  it("sets the Sentry user when an account id is present", () => {
    Object.defineProperty(global, "window", {
      configurable: true,
      value: {
        appConfig: {
          account: { id: 42 },
        },
      },
    });

    configureSentryUser();

    expect(Sentry.setUser).toHaveBeenCalledWith({ id: "42" });
  });

  it("does not set the Sentry user when account is missing", () => {
    Object.defineProperty(global, "window", {
      configurable: true,
      value: {
        appConfig: {},
      },
    });

    configureSentryUser();

    expect(Sentry.setUser).not.toHaveBeenCalled();
  });
});
