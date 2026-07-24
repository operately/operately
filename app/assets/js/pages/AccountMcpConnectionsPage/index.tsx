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
    mcpGrants: sortMcpGrants((data.mcpGrants || []) as Accounts.McpGrant[]),
  };
}

function Page() {
  const paths = usePaths();
  const formattedTimePreferences = useFormattedTimePreferences();
  const { mcpGrants } = Pages.useLoadedData<LoaderResult>();
  const [grants, setGrants] = React.useState<Accounts.McpGrant[]>(mcpGrants);
  const [pendingRevokeIds, setPendingRevokeIds] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    setGrants(sortMcpGrants(mcpGrants));
  }, [mcpGrants]);

  const handleRevokeGrant = React.useCallback(async (grantId: string) => {
    if (pendingRevokeIds[grantId]) return;

    const revokedGrant = grants.find((grant) => grant.id === grantId);
    if (!revokedGrant) return;

    setPendingRevokeIds((prev) => ({ ...prev, [grantId]: true }));
    setGrants((prev) => prev.filter((grant) => grant.id !== grantId));

    try {
      await Accounts.revokeMcpGrant(grantId);
      showSuccessToast("Connection Revoked", "The MCP client can no longer access your account.");
    } catch {
      setGrants((prev) => restoreGrant(prev, revokedGrant));
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
      mcpServerUrl={`${window.location.origin}/mcp`}
      formattedTimePreferences={formattedTimePreferences}
    />
  );
}

function sortMcpGrants(grants: Accounts.McpGrant[]) {
  return [...grants].sort(
    (a, b) => new Date(b.insertedAt).getTime() - new Date(a.insertedAt).getTime(),
  );
}

function restoreGrant(grants: Accounts.McpGrant[], revokedGrant: Accounts.McpGrant) {
  if (grants.some((grant) => grant.id === revokedGrant.id)) {
    return grants;
  }

  return sortMcpGrants([...grants, revokedGrant]);
}
