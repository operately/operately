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

export interface CompanyAdminManagePeoplePageProps {
  companyName: string;
  navigationItems: Navigation.Item[];
  addMemberPath: string;
  invitedPeople: CompanyAdminManagePerson[];
  currentMembers: CompanyAdminManagePerson[];
  outsideCollaborators?: CompanyAdminManagePerson[];
  showOutsideCollaborators?: boolean;
  onRemovePerson: (personId: string) => Promise<void> | void;
  onReissueInvitation: (personId: string) => Promise<string>;
  onRenewInvitation: (personId: string) => Promise<string>;
  onChangeAccessLevel: (personId: string, accessLevel: number) => Promise<void>;
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
