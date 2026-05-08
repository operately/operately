import { describe, it } from "node:test";
import * as assert from "node:assert";
import { getOrderedProfileNames, resolveProfileName } from "../../auth/shared/helpers";

describe("profile selection helpers", () => {
  it("orders saved profiles with the active profile first and the rest alphabetically", () => {
    const ordered = getOrderedProfileNames({
      activeProfile: "default",
      profiles: {
        staging: {},
        local: {},
        default: {},
      },
    });

    assert.deepStrictEqual(ordered, ["default", "local", "staging"]);
  });

  it("defaults to the active profile when the prompt is left blank", async () => {
    const prompts: string[] = [];

    const profile = await resolveProfileName(
      {
        activeProfile: "staging",
        profiles: {
          local: {},
          staging: {},
          default: {},
        },
      },
      null,
      async (prompt: string) => {
        prompts.push(prompt);
        return "";
      },
    );

    assert.strictEqual(profile, "staging");
    assert.deepStrictEqual(prompts, ["Profile name (default: staging):"]);
  });

  it("returns the explicit profile without prompting", async () => {
    const prompts: string[] = [];

    const profile = await resolveProfileName(
      {
        activeProfile: "default",
        profiles: {
          default: {},
          staging: {},
        },
      },
      " team ",
      async (prompt: string) => {
        prompts.push(prompt);
        return "ignored";
      },
    );

    assert.strictEqual(profile, "team");
    assert.deepStrictEqual(prompts, []);
  });
});
