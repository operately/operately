import type { GlobalSearch } from "../GlobalSearch";

export interface CompanyNavigationPerson {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
}

export interface CompanyNavigationUpdate {
  /** Version to update to, formatted for display (e.g. "v1.8"). */
  version: string;
  /** Where the badge points. Defaults to the public releases page. */
  link?: string;
  /** Prototype: which phrasing to show. Defaults to "Update to v1.8". */
  phrasing?: "update-to" | "available";
}

export interface CompanyNavigationLinks {
  home: string;
  workMap: string;
  profile: string;
  review: string;
  people: string;
  orgChart: string;
  notifications: string;
  account: string;
  companyAdmin: string;
  lobby: string;
  newGoal: string;
  newProject: string;
  newSpace: string;
  invitePeople: string;
  profileEdit: string;
  accountSettings: string;
  accountSecurity: string;
  accountApiTokens: string;
  accountMcpConnections: string;
}

export interface CompanyNavigationProps {
  companyName: string;
  me: CompanyNavigationPerson;
  links: CompanyNavigationLinks;
  canViewCompanyDirectory: boolean;
  canAddGoal: boolean;
  canAddProject: boolean;
  canAddSpace: boolean;
  canInvitePeople: boolean;
  unreadNotificationCount: number;
  reviewCount: number;
  /** Prototype: set when this instance is running behind the latest release. */
  availableUpdate?: CompanyNavigationUpdate | null;
  discordUrl: string;
  contactUsHref: string;
  onOpenKeyboardShortcuts: () => void;
  onLogOut: () => void;
  search: GlobalSearch.SearchFn;
  onNavigate: (link: string) => void;
  fullTextSearchPath?: (query: string) => string;
}
