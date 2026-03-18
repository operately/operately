import { handleStaleClientError, resetStaleClientReloadForTest } from "./staleClient";
import { showErrorToast } from "turboui";

jest.mock("turboui", () => ({
  showErrorToast: jest.fn(),
}));

function createStorageMock() {
  const store = new Map<string, string>();

  return {
    clear: jest.fn(() => store.clear()),
    getItem: jest.fn((key: string) => store.get(key) ?? null),
    removeItem: jest.fn((key: string) => store.delete(key)),
    setItem: jest.fn((key: string, value: string) => store.set(key, value)),
  };
}

function createAxiosError(status: number, version?: string) {
  return {
    isAxiosError: true,
    response: {
      status,
      headers: version ? { "x-operately-version": version } : {},
    },
  };
}

describe("handleStaleClientError", () => {
  const reload = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers();

    Object.defineProperty(global, "window", {
      configurable: true,
      value: {
        appConfig: { version: "v1" },
        location: { reload },
      },
    });

    Object.defineProperty(global, "sessionStorage", {
      configurable: true,
      value: createStorageMock(),
    });

    reload.mockReset();
    jest.mocked(showErrorToast).mockReset();
  });

  afterEach(() => {
    resetStaleClientReloadForTest();
    jest.useRealTimers();
  });

  it("shows a toast and reloads when a stale client receives a 404 from a newer version", () => {
    handleStaleClientError(createAxiosError(404, "v2"));

    expect(showErrorToast).toHaveBeenCalledWith(
      "App updated",
      "This tab is out of date. Reloading to get the latest version...",
    );

    expect(reload).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1500);

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("ignores 404s from the current version", () => {
    handleStaleClientError(createAxiosError(404, "v1"));

    expect(showErrorToast).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1500);

    expect(reload).not.toHaveBeenCalled();
  });

  it("schedules a reload only once per target version", () => {
    handleStaleClientError(createAxiosError(410, "v2"));
    handleStaleClientError(createAxiosError(410, "v2"));

    expect(showErrorToast).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(1500);

    expect(reload).toHaveBeenCalledTimes(1);
  });
});
