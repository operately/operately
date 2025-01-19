import * as Api from "@/api";
import * as Time from "@/utils/time";

import { Space } from "@/models/spaces";
import { Person } from "@/models/people";

export function goalMock(name: string, space: Space, champion: Person, params: Partial<Api.Goal> = {}): Api.Goal {
  return {
    id: name,
    name,
    spaceId: "1",
    space,
    champion,
    championId: champion.id,
    timeframe: params.timeframe || {
      startDate: Time.startOfCurrentYear().toISOString(),
      endDate: Time.endOfCurrentYear().toISOString(),
      type: "year",
    },
    ...params,
  } as unknown as Api.Goal;
}

export function spaceMock(name: string): Space {
  return { id: name, name } as unknown as Space;
}

export function personMock(name: string): Person {
  return { id: name, fullName: name } as unknown as Person;
}

export function projectMock(
  name: string,
  space: Space,
  champion: Person,
  params: Partial<Api.Project> = {},
): Api.Project {
  return {
    id: name,
    name,
    spaceId: "1",
    status: "active",
    space,
    champion,
    championId: champion.id,
    milestones: [],
    startedAt: Time.startOfCurrentYear().toISOString(),
    ...params,
  } as unknown as Api.Project;
}
