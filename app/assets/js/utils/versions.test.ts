import { compareVersions, extractReleaseVersion, parseVersion, toAvailableUpdate } from "./versions";

describe("versions", () => {
  describe("extractReleaseVersion", () => {
    it("extracts major.minor.patch from the release URL slug", () => {
      expect(
        extractReleaseVersion({
          id: "https://operately.com/releases/v180",
          title: "MCP Connections and more",
        }),
      ).toBe("v1.8.0");

      expect(
        extractReleaseVersion({
          id: "https://operately.com/releases/v170",
          title: "Anything",
        }),
      ).toBe("v1.7.0");
    });

    it("prefers the URL slug over title or teaser", () => {
      expect(
        extractReleaseVersion({
          id: "https://operately.com/releases/v180",
          title: "Operately v1.9 is here",
          teaser: "Operately 1.9.1 introduces MCP.",
        }),
      ).toBe("v1.8.0");
    });

    it("uses a plain guid when the id is not a release URL", () => {
      expect(extractReleaseVersion({ id: "v1.8", title: "Latest release" })).toBe("v1.8");
      expect(extractReleaseVersion({ id: "1.9.0", title: "Latest release" })).toBe("v1.9.0");
    });

    it("falls back to title/teaser when the id has no version", () => {
      expect(
        extractReleaseVersion({
          id: "unknown",
          title: "Operately v1.8 is here",
        }),
      ).toBe("v1.8");

      expect(
        extractReleaseVersion({
          title: "MCP Connections and more",
          teaser: "Operately 1.8.1 introduces MCP.",
        }),
      ).toBe("v1.8.1");
    });

    it("returns null for missing release", () => {
      expect(extractReleaseVersion(null)).toBeNull();
    });
  });

  describe("parseVersion / compareVersions", () => {
    it("parses versions with or without a v prefix", () => {
      expect(parseVersion("v1.8")).toEqual([1, 8]);
      expect(parseVersion("1.8.0")).toEqual([1, 8, 0]);
    });

    it("treats missing patch as zero", () => {
      expect(compareVersions("1.8", "1.8.0")).toBe(0);
      expect(compareVersions("v1.9", "1.8.0")).toBeGreaterThan(0);
      expect(compareVersions("1.7", "v1.8")).toBeLessThan(0);
    });

    it("returns null for unparseable versions", () => {
      expect(parseVersion("dev-version")).toBeNull();
      expect(compareVersions("v1.8", "nightly-build")).toBeNull();
    });
  });

  describe("toAvailableUpdate", () => {
    it("returns an update when the URL slug is newer than current", () => {
      expect(
        toAvailableUpdate({ id: "https://operately.com/releases/v190", title: "Notes" }, "v1.8.0"),
      ).toEqual({ version: "v1.9.0" });
    });

    it("returns null when current is up to date or newer", () => {
      expect(
        toAvailableUpdate({ id: "https://operately.com/releases/v180", title: "Notes" }, "v1.8.0"),
      ).toBeNull();
      expect(
        toAvailableUpdate({ id: "https://operately.com/releases/v180", title: "Notes" }, "v1.9"),
      ).toBeNull();
    });

    it("returns null when current or latest cannot be compared", () => {
      expect(toAvailableUpdate({ id: "https://operately.com/releases/v190", title: "Notes" }, null)).toBeNull();
      expect(
        toAvailableUpdate({ id: "https://operately.com/releases/v190", title: "Notes" }, "dev-version"),
      ).toBeNull();
      expect(toAvailableUpdate(null, "v1.8")).toBeNull();
    });
  });
});
