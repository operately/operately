import { truncateCompanyName } from "./truncateCompanyName";

describe("truncateCompanyName", () => {
  it("leaves short names alone", () => {
    expect(truncateCompanyName("Nexus")).toBe("Nexus");
    expect(truncateCompanyName("Nexus Global Manufacturi")).toBe("Nexus Global Manufacturi");
  });

  it("truncates names longer than 24 characters", () => {
    expect(truncateCompanyName("Nexus Global Manufacturing Group")).toBe("Nexus Global Manufactur…");
  });
});
