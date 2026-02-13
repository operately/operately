import React from "react";

import { Menu, MenuActionItem, MenuLinkItem, SubMenu } from "../../Menu";
import { IconId, IconLink, IconLock, IconPencil, IconRefresh, IconRotateDot, IconSwitch, IconUserX } from "../../icons";
import { createTestId } from "../../TestableElement";
import { AccessOptions, CompanyAdminManagePerson, Permissions } from "../types";

type PersonHandler = (person: CompanyAdminManagePerson) => void;

interface Props {
  person: CompanyAdminManagePerson;
  onOpenRemove: PersonHandler;
  onOpenConvert: PersonHandler;
  onOpenReissue: PersonHandler;
  onOpenView: PersonHandler;
  onOpenRenew: PersonHandler;
  onChangeAccessLevel: (personId: string, accessLevel: AccessOptions) => void;
  permissions?: Permissions;
  showConvertToGuest?: boolean;
  showAccessLevelOptions?: boolean;
}

export function PersonOptions({
  person,
  onOpenRemove,
  onOpenConvert,
  onOpenReissue,
  onOpenView,
  onOpenRenew,
  onChangeAccessLevel,
  permissions,
  showConvertToGuest,
  showAccessLevelOptions = true,
}: Props) {
  const testId = createTestId("person-options", person.id);
  const size = person.hasOpenInvitation ? "medium" : "small";
  const isInvited = person.hasOpenInvitation;

  return (
    <Menu testId={testId} size={size}>
      <MenuLinkItem icon={IconId} testId="view-profile" to={person.profilePath}>
        View Profile
      </MenuLinkItem>

      <MenuLinkItem icon={IconPencil} testId={createTestId("edit", person.id)} to={person.profileEditPath}>
        Edit Profile
      </MenuLinkItem>

      {!isInvited && permissions?.canEditMembersAccessLevels && showAccessLevelOptions && (
        <SubMenu icon={IconLock} label="Change access level" hidden={false}>
          <MenuActionItem
            testId={createTestId("edit-access", person.id)}
            onClick={() => onChangeAccessLevel(person.id, "edit_access")}
          >
            Edit access
          </MenuActionItem>
          <MenuActionItem
            testId={createTestId("comment-access", person.id)}
            onClick={() => onChangeAccessLevel(person.id, "comment_access")}
          >
            Comment access
          </MenuActionItem>
          <MenuActionItem
            testId={createTestId("view-access", person.id)}
            onClick={() => onChangeAccessLevel(person.id, "view_access")}
          >
            View access
          </MenuActionItem>
        </SubMenu>
      )}

      {showConvertToGuest && permissions?.canInviteMembers && person.canRemove && (
        <MenuActionItem
          icon={IconSwitch}
          onClick={() => onOpenConvert(person)}
          testId={createTestId("convert-to-guest", person.id)}
        >
          Convert to Outside Collaborator
        </MenuActionItem>
      )}

      {person.invitationExpired && (
        <MenuActionItem
          icon={IconRotateDot}
          onClick={() => onOpenRenew(person)}
          testId={createTestId("renew-invitation", person.id)}
        >
          Renew Invitation
        </MenuActionItem>
      )}

      {person.hasValidInvite && !person.invitationExpired && (
        <MenuActionItem
          icon={IconLink}
          onClick={() => onOpenView(person)}
          testId={createTestId("view-invite-link", person.id)}
        >
          View Invitation Link
        </MenuActionItem>
      )}

      {person.hasOpenInvitation && !person.invitationExpired && (
        <MenuActionItem
          icon={IconRefresh}
          onClick={() => onOpenReissue(person)}
          testId={createTestId("reissue-token", person.id)}
        >
          Re-Issue Invitation
        </MenuActionItem>
      )}

      {person.canRemove && (
        <MenuActionItem
          icon={IconUserX}
          onClick={() => onOpenRemove(person)}
          danger
          testId={createTestId("remove-person", person.id)}
        >
          {person.hasOpenInvitation ? "Revoke Invitation" : "Deactivate Account"}
        </MenuActionItem>
      )}
    </Menu>
  );
}
