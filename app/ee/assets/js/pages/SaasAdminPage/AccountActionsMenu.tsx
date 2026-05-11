import * as AdminApi from "@/ee/admin_api";
import * as React from "react";
import { IconShieldLock, IconTrash, Menu, MenuActionItem, showErrorToast, showSuccessToast } from "turboui";

interface AccountActionsMenuProps {
  account: AdminApi.Account;
  onPromote: () => void;
  onDemote: () => void;
  onDelete: () => void;
}

export function AccountActionsMenu({ account, onPromote, onDemote, onDelete }: AccountActionsMenuProps) {
  return (
    <Menu align="end" testId={`account-actions-${account.id}`}>
      {!account.siteAdmin && (
        <MenuActionItem icon={IconShieldLock} onClick={onPromote} testId={`promote-account-${account.id}`}>
          Promote to site admin
        </MenuActionItem>
      )}
      {account.siteAdmin && (
        <MenuActionItem icon={IconShieldLock} danger onClick={onDemote} testId={`demote-account-${account.id}`}>
          Remove site admin access
        </MenuActionItem>
      )}
      <MenuActionItem icon={IconTrash} danger onClick={onDelete} testId={`delete-account-${account.id}`}>
        Delete account
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
  refetch,
}: {
  pendingAction: PendingAccountAction | null;
  closeDialog: () => void;
  refetch: () => void;
}) {
  const [deleteAccount] = AdminApi.useDeleteAccount();
  const [promoteAccountToSiteAdmin] = AdminApi.usePromoteAccountToSiteAdmin();
  const [demoteAccountFromSiteAdmin] = AdminApi.useDemoteAccountFromSiteAdmin();

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

      finishPendingAction(pendingAction, refetch);
    } catch (error: any) {
      const message = error?.response?.data?.message || failedActionMessage(pendingAction.type);
      showErrorToast(failedActionTitle(pendingAction.type), message);
    }
  }, [
    closeDialog,
    deleteAccount,
    demoteAccountFromSiteAdmin,
    pendingAction,
    promoteAccountToSiteAdmin,
    refetch,
  ]);

  const dialogContent = pendingAction ? dialogDetails(pendingAction) : null;

  return { handleConfirmAction, dialogContent };
}

async function runPendingAction(
  action: PendingAccountAction,
  deleteAccount: ReturnType<typeof AdminApi.useDeleteAccount>[0],
  promoteAccountToSiteAdmin: ReturnType<typeof AdminApi.usePromoteAccountToSiteAdmin>[0],
  demoteAccountFromSiteAdmin: ReturnType<typeof AdminApi.useDemoteAccountFromSiteAdmin>[0],
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

function finishPendingAction(action: PendingAccountAction, refetch: () => void) {
  const currentAccountId = String(window.appConfig.account?.id);

  if (action.type === "delete" && action.account.id === currentAccountId) {
    window.location.assign("/log_in");
    return;
  }

  if (action.type === "demote" && action.account.id === currentAccountId) {
    window.location.assign("/");
    return;
  }

  refetch();
}

function dialogDetails(action: PendingAccountAction) {
  switch (action.type) {
    case "promote":
      return {
        title: "Grant site admin access",
        message: `Grant ${action.account.fullName} access to the site admin dashboard? Site admins can manage instance-wide settings and other privileged admin actions. Only grant this access to someone who should administer the whole site.`,
        confirmText: "Grant access",
        variant: "default" as const,
        testId: "promote-site-admin-confirmation",
      };
    case "demote":
      return {
        title: "Remove site admin access",
        message: `Remove site admin access from ${action.account.fullName}? This will revoke access to the site admin dashboard and other privileged admin actions. Use this carefully.`,
        confirmText: "Remove access",
        variant: "danger" as const,
        testId: "demote-site-admin-confirmation",
      };
    case "delete":
      return {
        title: "Delete account",
        message: `Delete ${action.account.fullName}? This will suspend all linked people, anonymize personal data, and revoke access permanently.`,
        confirmText: "Delete account",
        variant: "danger" as const,
        testId: "delete-account-confirmation",
      };
  }
}

function successActionTitle(actionType: PendingAccountAction["type"]) {
  switch (actionType) {
    case "promote":
      return "Site admin access granted";
    case "demote":
      return "Site admin access removed";
    case "delete":
      return "Account deleted";
  }
}

function successActionMessage(action: PendingAccountAction) {
  switch (action.type) {
    case "promote":
      return `${action.account.fullName} is now a site admin.`;
    case "demote":
      return `${action.account.fullName} no longer has site admin access.`;
    case "delete":
      return `${action.account.fullName} has been deleted.`;
  }
}

function blockedActionTitle(actionType: PendingAccountAction["type"]) {
  switch (actionType) {
    case "promote":
      return "Site admin update blocked";
    case "demote":
      return "Site admin demotion blocked";
    case "delete":
      return "Account deletion blocked";
  }
}

function failedActionTitle(actionType: PendingAccountAction["type"]) {
  switch (actionType) {
    case "promote":
      return "Site admin promotion failed";
    case "demote":
      return "Site admin demotion failed";
    case "delete":
      return "Account deletion failed";
  }
}

function failedActionMessage(actionType: PendingAccountAction["type"]) {
  switch (actionType) {
    case "promote":
      return "Failed to grant site admin access.";
    case "demote":
      return "Failed to remove site admin access.";
    case "delete":
      return "Failed to delete account.";
  }
}
