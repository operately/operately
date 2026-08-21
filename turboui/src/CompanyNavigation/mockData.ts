import type { CompanyNavigationLinks, CompanyNavigationPerson, CompanyNavigationProps } from "./types";

export const mockPerson: CompanyNavigationPerson = {
  id: "person-1",
  fullName: "John Johnson",
  email: "john.johnson@company.com",
  avatarUrl: "https://i.pravatar.cc/150?img=12",
};

export const mockLinks: CompanyNavigationLinks = {
  home: "/home",
  workMap: "/work-map",
  profile: "/people/person-1",
  review: "/review",
  people: "/people",
  orgChart: "/org-chart",
  notifications: "/notifications",
  account: "/account",
  companyAdmin: "/admin",
  lobby: "/lobby",
  newGoal: "/goals/new",
  newProject: "/projects/new",
  newSpace: "/spaces/new",
  invitePeople: "/people/invite",
  profileEdit: "/people/person-1/edit",
  accountSettings: "/account/settings",
  accountSecurity: "/account/security",
  accountApiTokens: "/account/api-tokens",
  accountMcpConnections: "/account/mcp",
};

export const defaultProps: CompanyNavigationProps = {
  companyName: "Nexus",
  me: mockPerson,
  links: mockLinks,
  canViewCompanyDirectory: true,
  canAddGoal: true,
  canAddProject: true,
  canAddSpace: true,
  canInvitePeople: true,
  unreadNotificationCount: 3,
  reviewCount: 2,
  discordUrl: "https://discord.gg/operately",
  contactUsHref: "mailto:support@operately.com",
  onOpenKeyboardShortcuts: () => console.log("open keyboard shortcuts"),
  onLogOut: () => console.log("log out"),
  search: async () => ({}),
  onNavigate: (link) => console.log("navigate", link),
  fullTextSearchPath: (query) => `/search?q=${query}`,
};
