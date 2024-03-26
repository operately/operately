import * as Groups from "@/models/groups";

export function spaceCompare(a: Groups.Group, b: Groups.Group): number {
  if (a.isCompanySpace && !b.isCompanySpace) {
    return -1;
  }

  if (!a.isCompanySpace && b.isCompanySpace) {
    return 1;
  }

  return a.name.localeCompare(b.name);
}
