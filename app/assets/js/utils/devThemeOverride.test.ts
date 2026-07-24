import {
  clearDevThemeOverride,
  isDevThemeOverrideEnabled,
  readDevThemeOverride,
  writeDevThemeOverride,
} from "./devThemeOverride";

type StorageMap = Record<string, string>;

function createMemoryStorage(initial: StorageMap = {}): Storage {
  const store: StorageMap = { ...initial };

  return {
    get length() {
      return Object.keys(store).length;
    },
    clear() {
      Object.keys(store).forEach((key) => delete store[key]);
    },
    getItem(key: string) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
    key(index: number) {
      return Object.keys(store)[index] ?? null;
    },
    removeItem(key: string) {
      delete store[key];
    },
    setItem(key: string, value: string) {
      store[key] = String(value);
    },
  };
}

describe("devThemeOverride", () => {
  const originalWindow = globalThis.window;
  let storage: Storage;

  function setShowDevBar(showDevBar: boolean) {
    (globalThis as any).window = {
      appConfig: { showDevBar },
      localStorage: storage,
    };
  }

  beforeEach(() => {
    storage = createMemoryStorage();
    setShowDevBar(true);
  });

  afterEach(() => {
    (globalThis as any).window = originalWindow;
  });

  it("is enabled only when the DevBar is shown", () => {
    expect(isDevThemeOverrideEnabled()).toBe(true);

    setShowDevBar(false);
    expect(isDevThemeOverrideEnabled()).toBe(false);
  });

  it("reads and writes the override only while the DevBar is enabled", () => {
    writeDevThemeOverride("light");
    expect(readDevThemeOverride()).toBe("light");

    writeDevThemeOverride("dark");
    expect(readDevThemeOverride()).toBe("dark");

    setShowDevBar(false);
    expect(readDevThemeOverride()).toBeNull();
    expect(storage.getItem("devBar:themeOverride")).toBe("dark");
  });

  it("ignores invalid stored values and clears the override", () => {
    storage.setItem("devBar:themeOverride", "system");
    expect(readDevThemeOverride()).toBeNull();

    writeDevThemeOverride("light");
    clearDevThemeOverride();
    expect(readDevThemeOverride()).toBeNull();
    expect(storage.getItem("devBar:themeOverride")).toBeNull();
  });

  it("does not write or clear storage when the DevBar is disabled", () => {
    setShowDevBar(false);

    writeDevThemeOverride("light");
    expect(storage.getItem("devBar:themeOverride")).toBeNull();

    storage.setItem("devBar:themeOverride", "dark");
    clearDevThemeOverride();
    expect(storage.getItem("devBar:themeOverride")).toBe("dark");
  });
});
