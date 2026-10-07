import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import * as AdminApi from "@/ee/admin_api";
import * as SaasAdmin from "@/ee/models/saasAdminLifecycle";
import * as React from "react";
import { IconShieldLock, IconTrash, Menu, MenuActionItem, showErrorToast, showSuccessToast } from "turboui";

interface AccountActionsMenuProps {
  account: AdminApi.Account;
  onPromote: () => void;
  onDemote: () => void;
  onDelete: () => void;
}

export function AccountActionsMenu({ account, onPromote, onDemote, onDelete }: AccountActionsMenuProps) {
  const { t } = useTranslation();
  return (
    <Menu align="end" testId={`account-actions-${account.id}`}>
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

export type PendingAccountAction =
  | { type: "promote"; account: AdminApi.Account }
  | { type: "demote"; account: AdminApi.Account }
  | { type: "delete"; account: AdminApi.Account };

export function useAccountActions({
  pendingAction,
  closeDialog,
}: {
  pendingAction: PendingAccountAction | null;
  closeDialog: () => void;
}) {
  // Self-deletion and demotion redirect away after revoking admin access.
  const currentAccountId = String(window.appConfig.account?.id);
  const { mutateAsync: deleteAccount } = SaasAdmin.useDeleteAccount({ currentAccountId });
  const { mutateAsync: promoteAccountToSiteAdmin } = SaasAdmin.usePromoteAccountToSiteAdmin();
  const { mutateAsync: demoteAccountFromSiteAdmin } = SaasAdmin.useDemoteAccountFromSiteAdmin({ currentAccountId });

  const handleConfirmAction = React.useCallback(async () => {
    if (!pendingAction) return;

    try {
      const result = await runPendingAction(
        pendingAction,
        deleteAccount,
        promoteAccountToSiteAdmin,
        demoteAccountFromSiteAdmin,
      );

      if (!result.success) {
        showErrorToast(blockedActionTitle(pendingAction.type), result.error || failedActionMessage(pendingAction.type));
        return;
      }

      showSuccessToast(successActionTitle(pendingAction.type), successActionMessage(pendingAction));
      closeDialog();

      finishPendingAction(pendingAction);
    } catch (error: any) {
      const message = error?.response?.data?.message || failedActionMessage(pendingAction.type);
      showErrorToast(failedActionTitle(pendingAction.type), message);
    }
  }, [closeDialog, deleteAccount, demoteAccountFromSiteAdmin, pendingAction, promoteAccountToSiteAdmin]);

  const dialogContent = pendingAction ? dialogDetails(pendingAction) : null;

  return { handleConfirmAction, dialogContent };
}

async function runPendingAction(
  action: PendingAccountAction,
  deleteAccount: ReturnType<typeof SaasAdmin.useDeleteAccount>["mutateAsync"],
  promoteAccountToSiteAdmin: ReturnType<typeof SaasAdmin.usePromoteAccountToSiteAdmin>["mutateAsync"],
  demoteAccountFromSiteAdmin: ReturnType<typeof SaasAdmin.useDemoteAccountFromSiteAdmin>["mutateAsync"],
) {
  switch (action.type) {
    case "promote":
      return promoteAccountToSiteAdmin({ accountId: action.account.id });
    case "demote":
      return demoteAccountFromSiteAdmin({ accountId: action.account.id });
    case "delete":
      return deleteAccount({ accountId: action.account.id });
  }
}

function finishPendingAction(action: PendingAccountAction) {
  const currentAccountId = String(window.appConfig.account?.id);

  if (action.type === "delete" && action.account.id === currentAccountId) {
    window.location.assign("/log_in");
    return;
  }

  if (action.type === "demote" && action.account.id === currentAccountId) {
    window.location.assign("/");
    return;
  }
}

function dialogDetails(action: PendingAccountAction) {
  switch (action.type) {
    case "promote":
      return {
        title: i18n.t("Grant site admin access"),
        message: i18n.t(
          "Grant {{fullName}} access to the site admin dashboard? Site admins can manage instance-wide settings and other privileged admin actions. Only grant this access to someone who should administer the whole site.",
          { fullName: action.account.fullName },
        ),
        confirmText: i18n.t("Grant access"),
        variant: "default" as const,
        testId: "promote-site-admin-confirmation",
      };
    case "demote":
      return {
        title: i18n.t("Remove site admin access"),
        message: i18n.t(
          "Remove site admin access from {{fullName}}? This will revoke access to the site admin dashboard and other privileged admin actions. Use this carefully.",
          { fullName: action.account.fullName },
        ),
        confirmText: i18n.t("Remove access"),
        variant: "danger" as const,
        testId: "demote-site-admin-confirmation",
      };
    case "delete":
      return {
        title: i18n.t("Delete account"),
        message: i18n.t(
          "Delete {{fullName}}? This will suspend all linked people, anonymize personal data, and revoke access permanently.",
          { fullName: action.account.fullName },
        ),
        confirmText: i18n.t("Delete account"),
        variant: "danger" as const,
        testId: "delete-account-confirmation",
      };
  }
}

function successActionTitle(actionType: PendingAccountAction["type"]) {
  switch (actionType) {
    case "promote":
      return i18n.t("Site admin access granted");
    case "demote":
      return i18n.t("Site admin access removed");
    case "delete":
      return i18n.t("Account deleted");
  }
}

function successActionMessage(action: PendingAccountAction) {
  switch (action.type) {
    case "promote":
      return i18n.t("{{fullName}} is now a site admin.", { fullName: action.account.fullName });
    case "demote":
      return i18n.t("{{fullName}} no longer has site admin access.", { fullName: action.account.fullName });
    case "delete":
      return i18n.t("{{fullName}} has been deleted.", { fullName: action.account.fullName });
  }
}

function blockedActionTitle(actionType: PendingAccountAction["type"]) {
  switch (actionType) {
    case "promote":
      return i18n.t("Site admin update blocked");
    case "demote":
      return i18n.t("Site admin demotion blocked");
    case "delete":
      return i18n.t("Account deletion blocked");
  }
}

function failedActionTitle(actionType: PendingAccountAction["type"]) {
  switch (actionType) {
    case "promote":
      return i18n.t("Site admin promotion failed");
    case "demote":
      return i18n.t("Site admin demotion failed");
    case "delete":
      return i18n.t("Account deletion failed");
  }
}

function failedActionMessage(actionType: PendingAccountAction["type"]) {
  switch (actionType) {
    case "promote":
      return i18n.t("Failed to grant site admin access.");
    case "demote":
      return i18n.t("Failed to remove site admin access.");
    case "delete":
      return i18n.t("Failed to delete account.");
  }
}
