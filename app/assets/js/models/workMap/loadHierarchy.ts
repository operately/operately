import Api, { type WorkMapsGetSettingsInput } from "@/api";
import { queryClient } from "@/api/queryClient";

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

// Editing permissions can change while the user is away from the map.
export async function loadWorkMapSettings(spaceId?: string): Promise<WorkMapsGetSettingsInput> {
  const settingsInput = { ...(spaceId && { spaceId }), includePinnedKpis: false };
  await queryClient.fetchQuery(Api.work_maps.getSettingsQueryOptions(settingsInput));
  return settingsInput;
}
