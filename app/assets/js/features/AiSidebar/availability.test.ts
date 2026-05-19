import { AI_NOT_CONFIGURED_MESSAGE, getAiAvailability } from "./availability";

function buildCompany(features: string[] | null) {
  return {
    enabledExperimentalFeatures: features,
  } as any;
}

describe("getAiAvailability", () => {
  it("returns disabled when ai is not configured", () => {
    expect(getAiAvailability(buildCompany(["ai"]), false)).toEqual({
      displayed: true,
      enabled: false,
      disabledMessage: AI_NOT_CONFIGURED_MESSAGE,
    });
  });

  it("returns hidden when the company does not have the ai feature", () => {
    expect(getAiAvailability(buildCompany(["experimental-ai"]), true)).toEqual({
      displayed: false,
      enabled: false,
    });
  });

  it("returns hidden while the company is still loading", () => {
    expect(getAiAvailability(null, true)).toEqual({ displayed: false, enabled: false });
  });

  it("returns enabled when ai is configured and the company has the ai feature", () => {
    expect(getAiAvailability(buildCompany(["ai", "experimental-ai"]), true)).toEqual({
      displayed: true,
      enabled: true,
    });
  });
});
