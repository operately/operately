import React from "react";

import { DangerButton, SecondaryButton } from "../Button";
import { FormattedTime, type FormattedTimePreferences } from "../FormattedTime";
import { IconTrash } from "../icons";
import { Menu, MenuActionItem } from "../Menu";
import { Modal } from "../Modal";
import { Page } from "../Page";
import { createTestId } from "../TestableElement";

export namespace AccountMcpConnectionsPage {
  export interface Grant {
    id: string;
    clientId: string;
    clientName: string;
    clientUri?: string | null;
    scopes: string[];
    insertedAt?: string | null;
    lastUsedAt?: string | null;
  }

  export interface Props {
    grants: Grant[];
    pendingRevokeIds: Record<string, boolean | undefined>;
    onRevokeGrant: (grantId: string) => void;
    homePath: string;
    securityPath: string;
    formattedTimePreferences: FormattedTimePreferences;
  }
}

const SCOPE_LABELS: Record<string, string> = {
  "mcp:read": "View data",
  "mcp:write": "Create, update, delete, and archive content",
};

export function AccountMcpConnectionsPage(props: AccountMcpConnectionsPage.Props) {
  const navigation = React.useMemo(
    () => [
      { to: props.homePath, label: "Home" },
      { to: props.securityPath, label: "Password & Security" },
    ],
    [props.homePath, props.securityPath],
  );

  return (
    <Page title="MCP Connections" size="medium" testId="account-mcp-connections-page" navigation={navigation}>
      <div className="px-4 sm:px-10 py-8">
        <header>
          <h1 className="text-2xl font-bold">MCP Connections</h1>
          <p className="text-sm text-content-dimmed mt-2">
            Manage AI clients connected to your Operately account through MCP OAuth.
          </p>
        </header>

        <section className="mt-10" data-test-id="existing-mcp-connections-section">
          <h2 className="font-bold">Connected Clients</h2>
          <p className="text-sm text-content-dimmed mt-1">
            Revoke a connection if you no longer trust the client or want to stop its access.
          </p>

          {props.grants.length === 0 ? (
            <div className="text-sm text-content-dimmed rounded-md border border-stroke-base p-4 mt-3">
              No MCP connections yet.
            </div>
          ) : (
            <GrantList
              grants={props.grants}
              pendingRevokeIds={props.pendingRevokeIds}
              onRevokeGrant={props.onRevokeGrant}
              formattedTimePreferences={props.formattedTimePreferences}
            />
          )}
        </section>
      </div>
    </Page>
  );
}

function GrantList({
  grants,
  pendingRevokeIds,
  onRevokeGrant,
  formattedTimePreferences,
}: {
  grants: AccountMcpConnectionsPage.Grant[];
  pendingRevokeIds: Record<string, boolean | undefined>;
  onRevokeGrant: (grantId: string) => void;
  formattedTimePreferences: FormattedTimePreferences;
}) {
  return (
    <div className="mt-3">
      <div className="rounded-md border border-stroke-base overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-surface-dimmed text-left">
              <th className="px-3 py-2 font-semibold">Client</th>
              <th className="px-3 py-2 font-semibold">Access</th>
              <th className="px-3 py-2 font-semibold">Connected</th>
              <th className="px-3 py-2 font-semibold whitespace-nowrap">Last Used</th>
              <th className="px-3 py-2 text-right">
                <span className="sr-only">Options</span>
              </th>
            </tr>
          </thead>

          <tbody>
            {grants.map((grant) => (
              <GrantRow
                key={grant.id}
                grant={grant}
                isRevoking={Boolean(pendingRevokeIds[grant.id])}
                onRevokeGrant={onRevokeGrant}
                formattedTimePreferences={formattedTimePreferences}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GrantRow({
  grant,
  isRevoking,
  onRevokeGrant,
  formattedTimePreferences,
}: {
  grant: AccountMcpConnectionsPage.Grant;
  isRevoking: boolean;
  onRevokeGrant: (grantId: string) => void;
  formattedTimePreferences: FormattedTimePreferences;
}) {
  const [isRevokeModalOpen, setIsRevokeModalOpen] = React.useState(false);

  const openRevokeModal = React.useCallback(() => {
    if (isRevoking) return;
    setIsRevokeModalOpen(true);
  }, [isRevoking]);

  const confirmRevoke = React.useCallback(() => {
    if (isRevoking) return;
    setIsRevokeModalOpen(false);
    onRevokeGrant(grant.id);
  }, [grant.id, isRevoking, onRevokeGrant]);

  return (
    <>
      <tr className="border-t border-stroke-base" data-test-id={createTestId("mcp-connection-row", grant.id)}>
        <td className="px-3 py-3">
          <div className="max-w-[220px] sm:max-w-[320px] whitespace-normal break-words">
            <div className="font-medium">{displayClientName(grant)}</div>
            <div className="text-xs text-content-dimmed mt-1 break-all">{grant.clientId}</div>
          </div>
        </td>

        <td className="px-3 py-3">
          <div className="max-w-[240px] whitespace-normal break-words text-content-dimmed">
            {formatScopes(grant.scopes)}
          </div>
        </td>

        <td className="px-3 py-3 text-content-dimmed whitespace-nowrap">
          <Timestamp value={grant.insertedAt} emptyLabel="Not available" formattedTimePreferences={formattedTimePreferences} />
        </td>

        <td className="px-3 py-3 text-content-dimmed">
          <Timestamp value={grant.lastUsedAt} emptyLabel="Never" formattedTimePreferences={formattedTimePreferences} />
        </td>

        <td className="px-3 py-3 text-right">
          <div className="inline-flex">
            <Menu align="end" testId={createTestId("mcp-connection-actions-menu", grant.id)}>
              <MenuActionItem
                icon={IconTrash}
                onClick={openRevokeModal}
                danger
                testId={createTestId("revoke-mcp-connection", grant.id)}
              >
                Revoke
              </MenuActionItem>
            </Menu>
          </div>
        </td>
      </tr>

      <RevokeGrantModal
        isOpen={isRevokeModalOpen}
        onClose={() => setIsRevokeModalOpen(false)}
        onConfirm={confirmRevoke}
        isRevoking={isRevoking}
        clientName={displayClientName(grant)}
      />
    </>
  );
}

function RevokeGrantModal({
  isOpen,
  onClose,
  onConfirm,
  isRevoking,
  clientName,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isRevoking: boolean;
  clientName: string;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="small" title="Revoke connection" testId="revoke-mcp-connection-modal">
      <div className="space-y-4">
        <p className="text-sm text-content-dimmed">
          Revoke access for <span className="font-medium text-content-base">{clientName}</span>? The client will need
          to reconnect through OAuth.
        </p>

        <div className="flex justify-end gap-3">
          <SecondaryButton type="button" onClick={onClose} disabled={isRevoking} testId="revoke-mcp-connection-cancel">
            Cancel
          </SecondaryButton>

          <DangerButton type="button" onClick={onConfirm} loading={isRevoking} testId="revoke-mcp-connection-confirm">
            Revoke
          </DangerButton>
        </div>
      </div>
    </Modal>
  );
}

function displayClientName(grant: AccountMcpConnectionsPage.Grant) {
  const name = grant.clientName?.trim();
  if (name) return name;

  try {
    return new URL(grant.clientId).host;
  } catch {
    return grant.clientId;
  }
}

function formatScopes(scopes: string[]) {
  if (scopes.length === 0) {
    return SCOPE_LABELS["mcp:read"];
  }

  return scopes.map((scope) => SCOPE_LABELS[scope] || scope).join(" · ");
}

function Timestamp({
  value,
  emptyLabel,
  formattedTimePreferences,
}: {
  value?: string | null;
  emptyLabel: string;
  formattedTimePreferences: FormattedTimePreferences;
}) {
  if (value === null) return <span>{emptyLabel}</span>;
  if (value === undefined) return <span>-</span>;

  return <FormattedTime {...formattedTimePreferences} time={value} format="relative-time-or-date" />;
}

export default AccountMcpConnectionsPage;
