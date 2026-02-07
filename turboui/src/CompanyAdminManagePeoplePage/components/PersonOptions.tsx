import React from "react";

import { Menu, MenuActionItem, MenuLinkItem, SubMenu } from "../../Menu";
import { IconId, IconLink, IconLock, IconPencil, IconRefresh, IconUserX, IconRotateDot } from "../../icons";
import { createTestId } from "../../TestableElement";
import { CompanyAdminManagePerson } from "../types";

type PersonHandler = (person: CompanyAdminManagePerson) => void;

const PERMISSION_LEVELS = {
  VIEW_ACCESS: 10,
  COMMENT_ACCESS: 40,
  EDIT_ACCESS: 70,
  FULL_ACCESS: 100,
};

export function PersonOptions({
  person,
  onOpenRemove,
  onOpenReissue,
  onOpenView,
  onOpenRenew,
  onChangeAccessLevel,
}: {
  person: CompanyAdminManagePerson;
  onOpenRemove: PersonHandler;
  onOpenReissue: PersonHandler;
  onOpenView: PersonHandler;
  onOpenRenew: PersonHandler;
  onChangeAccessLevel: (personId: string, accessLevel: number) => void;
}) {
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

      {!isInvited && (
        <SubMenu icon={IconLock} label="Change access level" hidden={false}>
          <MenuActionItem testId={createTestId("edit-access", person.id)} onClick={() => onChangeAccessLevel(person.id, PERMISSION_LEVELS.EDIT_ACCESS)}>
            Edit access
          </MenuActionItem>
          <MenuActionItem testId={createTestId("comment-access", person.id)} onClick={() => onChangeAccessLevel(person.id, PERMISSION_LEVELS.COMMENT_ACCESS)}>
            Comment access
          </MenuActionItem>
          <MenuActionItem testId={createTestId("view-access", person.id)} onClick={() => onChangeAccessLevel(person.id, PERMISSION_LEVELS.VIEW_ACCESS)}>
            View access
          </MenuActionItem>
        </SubMenu>
      )}

      {person.invitationExpired && (
        <MenuActionItem icon={IconRotateDot} onClick={() => onOpenRenew(person)} testId={createTestId("renew-invitation", person.id)}>
          Renew Invitation
        </MenuActionItem>
      )}

      {person.hasValidInvite && !person.invitationExpired && (
        <MenuActionItem icon={IconLink} onClick={() => onOpenView(person)} testId={createTestId("view-invite-link", person.id)}>
          View Invitation Link
        </MenuActionItem>
      )}

      {person.hasOpenInvitation && !person.invitationExpired && (
        <MenuActionItem icon={IconRefresh} onClick={() => onOpenReissue(person)} testId={createTestId("reissue-token", person.id)}>
          Re-Issue Invitation
        </MenuActionItem>
      )}

      {person.canRemove && (
        <MenuActionItem icon={IconUserX} onClick={() => onOpenRemove(person)} danger testId={createTestId("remove-person", person.id)}>
          {person.hasOpenInvitation ? "Revoke Invitation" : "Deactivate Account"}
        </MenuActionItem>
      )}
    </Menu>
  );
}
