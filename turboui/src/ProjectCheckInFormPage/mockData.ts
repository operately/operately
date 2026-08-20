import type { Person, ProjectCheckIn } from "../ApiTypes";
import { asRichText } from "../utils/storybook/richContent";
import { genPeople } from "../utils/storybook/genPeople";

const people = genPeople(3);

export const mockReviewer: Person = {
  __typename: "person",
  id: people[0]!.id,
  fullName: people[0]!.fullName,
  title: people[0]!.title,
  avatarUrl: people[0]!.avatarUrl,
  email: "reviewer@example.com",
  type: "member",
  hasOpenInvitation: false,
};

export const mockAuthor: Person = {
  __typename: "person",
  id: people[1]!.id,
  fullName: people[1]!.fullName,
  title: people[1]!.title,
  avatarUrl: people[1]!.avatarUrl,
  email: "author@example.com",
  type: "member",
  hasOpenInvitation: false,
};

const description = JSON.stringify(asRichText("Shipped the onboarding flow and started QA."));

export function createMockCheckIn(overrides: Partial<ProjectCheckIn> = {}): ProjectCheckIn {
  return {
    __typename: "project_check_in",
    id: "check-in-1",
    status: "on_track",
    state: "published",
    insertedAt: "2024-06-01T12:00:00.000Z",
    updatedAt: "2024-06-01T12:00:00.000Z",
    publishedAt: "2024-06-01T12:00:00.000Z",
    scheduledAt: null,
    description,
    author: mockAuthor,
    project: {
      __typename: "project",
      id: "project-1",
      name: "Apollo",
    } as ProjectCheckIn["project"],
    space: {
      __typename: "space",
      id: "space-1",
      name: "Product",
    } as ProjectCheckIn["space"],
    acknowledgedAt: null,
    acknowledgedBy: null,
    ...overrides,
  };
}

export const navigation = [
  { to: "/spaces/space-1", label: "Product" },
  { to: "/spaces/space-1/work-map/projects", label: "Work Map" },
  { to: "/projects/project-1", label: "Apollo" },
  { to: "/projects/project-1?tab=check-ins", label: "Check-Ins" },
];
