import type { AccessLevels } from "../ApiTypes";
import type { AvatarPerson } from "../Avatar";
import type { SpaceCardProps } from "./SpaceCard";

export function accessLevels(overrides: Partial<AccessLevels> = {}): AccessLevels {
  return {
    __typename: "access_levels",
    public: 0,
    company: 0,
    space: 70,
    ...overrides,
  };
}

export const mockMembers: AvatarPerson[] = [
  { id: "1", fullName: "Alice Johnson", avatarUrl: null },
  { id: "2", fullName: "Bob Smith", avatarUrl: null },
  { id: "3", fullName: "Carol Lee", avatarUrl: null },
];

export const defaultSpaceCardProps: SpaceCardProps = {
  name: "Product",
  mission: "Build and ship the Operately product experience.",
  accessLevels: accessLevels({ company: 10 }),
  members: mockMembers,
  linkTo: "/spaces/product",
};

export const publicSpaceCardProps: SpaceCardProps = {
  ...defaultSpaceCardProps,
  name: "Community",
  mission: "Share updates with anyone who has the link.",
  accessLevels: accessLevels({ public: 10 }),
  linkTo: "/spaces/community",
};

export const inviteOnlySpaceCardProps: SpaceCardProps = {
  ...defaultSpaceCardProps,
  name: "Leadership",
  mission: "Private leadership discussions and planning.",
  accessLevels: accessLevels({ public: 0, company: 0 }),
  linkTo: "/spaces/leadership",
};

export const companySpaceCardProps: SpaceCardProps = {
  ...defaultSpaceCardProps,
  name: "Company",
  mission: "Visible to everyone in the company.",
  accessLevels: accessLevels({ company: 10 }),
  linkTo: "/spaces/company",
};
