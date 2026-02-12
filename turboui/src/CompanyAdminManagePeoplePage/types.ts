import type { Navigation } from "../Page/Navigation";

export interface CompanyAdminManagePerson {
  id: string;
  fullName: string;
  title?: string | null;
  email: string;
  avatarUrl: string | null;
  hasOpenInvitation: boolean;
  hasValidInvite: boolean;
  invitationExpired: boolean;
  expiresIn?: string | null;
  profilePath: string;
  profileEditPath: string;
  inviteLinkUrl?: string | null;
  canRemove: boolean;
  accessLevel?: number;
}

export type AccessOptions =
  | "minimal_access"
  | "view_access"
  | "comment_access"
  | "edit_access"

export interface CompanyAdminManagePeoplePageProps {
  companyName: string;
  navigationItems: Navigation.Item[];
  addMemberPath: string;
  invitedPeople: CompanyAdminManagePerson[];
  currentMembers: CompanyAdminManagePerson[];
  outsideCollaborators?: CompanyAdminManagePerson[];
  onRemovePerson: (personId: string) => Promise<void> | void;
  onConvertToGuest: (personId: string) => Promise<void>;
  onReissueInvitation: (personId: string) => Promise<string>;
  onRenewInvitation: (personId: string) => Promise<string>;
  onChangeAccessLevel: (personId: string, accessLevel: AccessOptions) => Promise<void>;
  onRenewModalClose?: () => void;
  testId?: string;
  permissions: Permissions;
}

export interface Permissions {
  canEditTrustedEmailDomains?: boolean;
  canInviteMembers?: boolean;
  canRemoveMembers?: boolean;
  canCreateSpace?: boolean;
  canManageAdmins?: boolean;
  canManageOwners?: boolean;
  canEditMembersAccessLevels?: boolean;
}
