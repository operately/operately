import { truncateCompanyName } from "./truncateCompanyName";

describe("truncateCompanyName", () => {
  it("leaves short names alone", () => {
    expect(truncateCompanyName("Nexus")).toBe("Nexus");
    expect(truncateCompanyName("Nexus Global Manufacturi")).toBe("Nexus Global Manufacturi");
  });

  it("truncates names longer than 24 characters", () => {
    expect(truncateCompanyName("Nexus Global Manufacturing Group")).toBe("Nexus Global Manufactur…");
  });

  it("does not split surrogate-pair emoji at the truncation boundary", () => {
    const name = `${"A".repeat(23)}🚀X`;

    expect(truncateCompanyName(name)).toBe(`${"A".repeat(23)}…`);
  });

  it("does not split flag emoji at the truncation boundary", () => {
    const flag = "🇺🇸";
    const name = `${"A".repeat(22)}${flag}XX`;

    expect(truncateCompanyName(name)).toBe(`${"A".repeat(22)}${flag}…`);
  });

  it("keeps combining marks attached to their base character", () => {
    const accented = "e\u0301";
    const name = `${"A".repeat(22)}${accented}XX`;

    expect(truncateCompanyName(name)).toBe(`${"A".repeat(22)}${accented}…`);
  });

  it("does not split ZWJ emoji sequences at the truncation boundary", () => {
    const zwjEmoji = "👨‍💻";
    const name = `${"A".repeat(22)}${zwjEmoji}XX`;

    expect(truncateCompanyName(name)).toBe(`${"A".repeat(22)}${zwjEmoji}…`);
  });
});
