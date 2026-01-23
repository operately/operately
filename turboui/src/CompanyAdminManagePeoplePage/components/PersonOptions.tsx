import React from "react";

import { Menu, MenuActionItem, MenuLinkItem } from "../../Menu";
import { IconId, IconLink, IconRefresh, IconUserX } from "../../icons";
import { createTestId } from "../../TestableElement";
import { CompanyAdminManagePerson } from "../types";

type PersonHandler = (person: CompanyAdminManagePerson) => void;

export function PersonOptions({
  person,
  onOpenRemove,
  onOpenReissue,
  onOpenView,
}: {
  person: CompanyAdminManagePerson;
  onOpenRemove: PersonHandler;
  onOpenReissue: PersonHandler;
  onOpenView: PersonHandler;
}) {
  const testId = createTestId("person-options", person.id);
  const size = person.hasOpenInvitation ? "medium" : "small";

  return (
    <Menu testId={testId} size={size}>
      <MenuLinkItem icon={IconId} testId="view-profile" to={person.profilePath}>
        View Profile
      </MenuLinkItem>

      {person.hasValidInvite && (
        <MenuActionItem icon={IconLink} onClick={() => onOpenView(person)} testId={createTestId("view-invite-link", person.id)}>
          View Invitation Link
        </MenuActionItem>
      )}

      {person.hasOpenInvitation && (
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
