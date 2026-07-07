import * as Accounts from "@/models/accounts";
import * as Pages from "@/components/Pages";
import * as React from "react";

import { PageModule } from "@/routes/types";
import { usePaths } from "@/routes/paths";
import { AccountMcpConnectionsPage, showErrorToast, showSuccessToast } from "turboui";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";

export default { name: "AccountMcpConnectionsPage", loader, Page } as PageModule;

interface LoaderResult {
  mcpGrants: Accounts.McpGrant[];
}

async function loader(): Promise<LoaderResult> {
  const data = await Accounts.listMcpGrants();

  return {
    mcpGrants: (data.mcpGrants || []) as Accounts.McpGrant[],
  };
}

function Page() {
  const paths = usePaths();
  const formattedTimePreferences = useFormattedTimePreferences();
  const { mcpGrants } = Pages.useLoadedData<LoaderResult>();
  const [grants, setGrants] = React.useState<Accounts.McpGrant[]>(mcpGrants);
  const [pendingRevokeIds, setPendingRevokeIds] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    setGrants(mcpGrants);
  }, [mcpGrants]);

  const handleRevokeGrant = React.useCallback(async (grantId: string) => {
    if (pendingRevokeIds[grantId]) return;

    const previousIndex = grants.findIndex((grant) => grant.id === grantId);
    if (previousIndex === -1) return;
    const revokedGrant = grants[previousIndex];
    if (!revokedGrant) return;

    setPendingRevokeIds((prev) => ({ ...prev, [grantId]: true }));
    setGrants((prev) => prev.filter((grant) => grant.id !== grantId));

    try {
      await Accounts.revokeMcpGrant(grantId);
      showSuccessToast("Connection Revoked", "The MCP client can no longer access your account.");
    } catch {
      setGrants((prev) => {
        const next = [...prev];
        next.splice(previousIndex, 0, revokedGrant);
        return next;
      });
      showErrorToast("Failed To Revoke Connection", "Please try again.");
    } finally {
      setPendingRevokeIds((prev) => {
        const next = { ...prev };
        delete next[grantId];
        return next;
      });
    }
  }, [grants, pendingRevokeIds]);

  return (
    <AccountMcpConnectionsPage
      grants={grants}
      pendingRevokeIds={pendingRevokeIds}
      onRevokeGrant={handleRevokeGrant}
      homePath={paths.homePath()}
      securityPath={paths.accountSecurityPath()}
      formattedTimePreferences={formattedTimePreferences}
    />
  );
}
