import React from "react";

import type { HomePageProps, HomePageSpace } from "./types";

export const mockSpaces: HomePageSpace[] = [
  {
    id: "company-space",
    name: "Company",
    mission: "Company-wide work",
    isCompanySpace: true,
    members: [{ id: "1", fullName: "John Johnson" }],
    link: "/spaces/company-space",
  },
  {
    id: "product",
    name: "Product",
    mission: "Ship the product",
    isCompanySpace: false,
    members: [{ id: "1", fullName: "John Johnson" }],
    link: "/spaces/product",
  },
];

export const defaultProps: HomePageProps = {
  firstName: "John",
  spaces: mockSpaces,
  canCreateSpace: true,
  canInviteMembers: true,
  newSpacePath: "/spaces/new",
  invitePeoplePath: "/people/invite",
  activityFeed: <div>Activity feed</div>,
  now: new Date("2026-08-21T10:00:00"),
};
