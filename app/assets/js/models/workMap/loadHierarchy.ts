import Api from "@/api";

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
