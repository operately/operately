import { formatProductReleaseVersion } from "./formatVersion";

describe("formatProductReleaseVersion", () => {
  it("formats a three-digit slug as major.minor when patch is zero", () => {
    expect(formatProductReleaseVersion("https://operately.com/releases/v180")).toBe("v1.8");
    expect(formatProductReleaseVersion("https://operately.com/releases/v170")).toBe("v1.7");
  });

  it("keeps a non-zero patch", () => {
    expect(formatProductReleaseVersion("https://operately.com/releases/v181")).toBe("v1.8.1");
  });

  it("returns null for unexpected ids", () => {
    expect(formatProductReleaseVersion(null)).toBeNull();
    expect(formatProductReleaseVersion("v1.8")).toBeNull();
    expect(formatProductReleaseVersion("https://operately.com/releases/v18")).toBeNull();
  });
});
