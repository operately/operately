import Api, { type WorkMapsGetSettingsInput } from "@/api";

// Both route versions use these inputs so preloading the usual URL also warms the pilot.
export async function loadCompanyWorkMap() {
  const workMapInput = { includeReviewer: true };
  await Api.companies.getWorkMapQuery(workMapInput);
  return { workMapInput, spaceInput: null };
}

export async function loadSpaceWorkMap(id: string, includeCrossSpaceParents = false) {
  const workMapInput = {
    spaceId: id,
    includeReviewer: true,
    ...(includeCrossSpaceParents && { includeCrossSpaceParents }),
  };
  const spaceInput = { id, includeAccessLevels: true, includePermissions: true };
  await Promise.all([Api.companies.getWorkMapQuery(workMapInput), Api.spaces.getQuery(spaceInput)]);
  return { workMapInput, spaceInput };
}

// The pin strip loads measurements on its own, so this read skips them. Callers must reuse the returned input.
export async function loadWorkMapSettings(spaceId?: string): Promise<WorkMapsGetSettingsInput> {
  const settingsInput = { ...(spaceId && { spaceId }), includePinnedKpis: false };
  await Api.work_maps.getSettingsQuery(settingsInput);
  return settingsInput;
}
