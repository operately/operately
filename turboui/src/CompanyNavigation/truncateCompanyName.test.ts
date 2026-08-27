import { truncateCompanyName } from "./truncateCompanyName";

describe("truncateCompanyName", () => {
  it("leaves short names alone", () => {
    expect(truncateCompanyName("Nexus")).toBe("Nexus");
    expect(truncateCompanyName("Nexus Global Manufacturi")).toBe("Nexus Global Manufacturi");
  });

  it("truncates names longer than 24 characters", () => {
    expect(truncateCompanyName("Nexus Global Manufacturing Group")).toBe("Nexus Global Manufactur…");
  });

  it("does not split multi-unit characters at the truncation boundary", () => {
    // 23 ASCII characters + rocket emoji (one code point, two UTF-16 units) + "X"
    const name = `${"A".repeat(23)}🚀X`;

    expect(truncateCompanyName(name)).toBe(`${"A".repeat(23)}…`);
  });

  it("counts multi-unit characters as a single character toward the limit", () => {
    const name = "🚀".repeat(24);

    expect(truncateCompanyName(name)).toBe(name);
    expect(truncateCompanyName(`${name}X`)).toBe(`${"🚀".repeat(23)}…`);
  });
});
