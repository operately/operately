import React from "react";
import { useTranslation } from "react-i18next";
import { IconCopy, IconShieldLock, IconTrash } from "../icons";
import { Menu, MenuActionItem } from "../Menu";

interface SaasAdminAccountActionsMenuProps {
  account: { id: string; siteAdmin: boolean };
  onCopyId: () => void;
  onPromote: () => void;
  onDemote: () => void;
  onDelete: () => void;
}

export function SaasAdminAccountActionsMenu({
  account,
  onCopyId,
  onPromote,
  onDemote,
  onDelete,
}: SaasAdminAccountActionsMenuProps) {
  const { t } = useTranslation();
  return (
    <Menu align="end" testId={`account-actions-${account.id}`}>
      <MenuActionItem icon={IconCopy} onClick={onCopyId} testId={`copy-account-id-${account.id}`}>
        {t("Copy account ID")}
      </MenuActionItem>
      {!account.siteAdmin && (
        <MenuActionItem icon={IconShieldLock} onClick={onPromote} testId={`promote-account-${account.id}`}>
          {t("Promote to site admin")}
        </MenuActionItem>
      )}
      {account.siteAdmin && (
        <MenuActionItem icon={IconShieldLock} danger onClick={onDemote} testId={`demote-account-${account.id}`}>
          {t("Remove site admin access")}
        </MenuActionItem>
      )}
      <MenuActionItem icon={IconTrash} danger onClick={onDelete} testId={`delete-account-${account.id}`}>
        {t("Delete account")}
      </MenuActionItem>
    </Menu>
  );
}
