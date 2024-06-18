import { Goal } from "@/models/goals";
import { Project } from "@/models/projects";
import { Space } from "@/models/spaces";
import { Person } from "@/models/people";

export function goalMock(name: string, space: Space, champion: Person, params: Partial<Goal> = {}): Goal {
  return {
    id: name,
    name,
    spaceId: "1",
    space,
    champion,
    championId: champion.id,
    ...params,
  } as unknown as Goal;
}

export function spaceMock(name: string): Space {
  return { id: name, name } as unknown as Space;
}

export function personMock(name: string): Person {
  return { id: name, fullName: name } as unknown as Person;
}

export function projectMock(name: string, space: Space, champion: Person, params: Partial<Project> = {}): Project {
  return {
    id: name,
    name,
    spaceId: "1",
    space,
    champion,
    championId: champion.id,
    milestones: [],
    ...params,
  } as unknown as Project;
}
