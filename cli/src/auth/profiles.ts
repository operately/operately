import { DEFAULT_BASE_URL, type CliConfig } from "./config";
import { getOrderedProfileNames } from "./shared/helpers";

export function executeAuthProfiles(config: CliConfig): number {
  const profileNames = getOrderedProfileNames(config);

  if (profileNames.length === 0) {
    console.log("No saved CLI profiles.");
    console.log("Use `operately auth login`, `operately auth signup`, `operately auth join`, or `operately auth create-company` to create one.");
    return 0;
  }

  console.log("Saved CLI profiles:");

  for (const profileName of profileNames) {
    const profile = config.profiles[profileName] ?? {};
    const isActive = profileName === config.activeProfile;
    const marker = isActive ? "*" : "-";
    const label = isActive ? `${profileName} (active)` : profileName;

    console.log(`${marker} ${label}`);
    console.log(`  Status: ${profile.token ? "Logged in" : "Not logged in"}`);

    if (profile.name) {
      console.log(`  Name: ${profile.name}`);
    }

    if (profile.companyName) {
      console.log(`  Company: ${profile.companyName}`);
    }

    console.log(`  Base URL: ${profile.baseUrl || DEFAULT_BASE_URL}`);
  }

  console.log("");
  console.log("Use `--profile <name>` with any command to select a saved profile.");

  return 0;
}
