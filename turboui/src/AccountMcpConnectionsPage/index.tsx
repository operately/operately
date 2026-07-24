import React from "react";

import { DangerButton, SecondaryButton } from "../Button";
import { CopyToClipboard } from "../CopyToClipboard";
import { FormattedTime, type FormattedTimePreferences } from "../FormattedTime";
import { IconExternalLink, IconTrash } from "../icons";
import { DivLink } from "../Link";
import { Menu, MenuActionItem } from "../Menu";
import { Modal } from "../Modal";
import { Page } from "../Page";
import { createTestId } from "../TestableElement";

const MCP_DOCS_URL = "https://operately.com/help/mcp-connections/";

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
    mcpServerUrl: string;
    formattedTimePreferences: FormattedTimePreferences;
  }
}

const SCOPE_LABELS: Record<string, string> = {
  "mcp:read": "View data",
  "mcp:write": "Edit data",
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
    <Page title="MCP Connections" size="small" testId="account-mcp-connections-page" navigation={navigation}>
      <div className="px-4 sm:px-10 py-8">
        <header>
          <h1 className="text-2xl font-bold">MCP Connections</h1>
          <p className="text-sm text-content-dimmed mt-2">
            Connect AI clients via MCP and manage their access here.
          </p>
        </header>

        <ServerUrlSection mcpServerUrl={props.mcpServerUrl} />

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

function ServerUrlSection({ mcpServerUrl }: { mcpServerUrl: string }) {
  return (
    <section className="mt-8" data-test-id="mcp-server-url-section">
      <h2 className="font-bold">Server URL</h2>
      <p className="text-sm text-content-dimmed mt-1">Use this URL to create a connection in your AI client.</p>

      <div className="mt-3 rounded-md border border-stroke-base bg-surface-dimmed px-3 py-2.5 flex items-center gap-3">
        <code className="text-sm font-mono break-all flex-1 select-all" data-test-id="mcp-server-url">
          {mcpServerUrl}
        </code>
        <CopyToClipboard text={mcpServerUrl} size={18} className="shrink-0" testId="copy-mcp-server-url" />
      </div>

      <p className="text-sm text-content-dimmed mt-3">
        More details are in the docs:{" "}
        <DivLink
          to={MCP_DOCS_URL}
          external
          target="_blank"
          className="text-link-base hover:text-link-hover inline-flex items-center gap-1"
          testId="mcp-setup-guides-link"
        >
          Setup guides
          <IconExternalLink size={14} />
        </DivLink>
      </p>
    </section>
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
          <div className="max-w-[220px] sm:max-w-[320px] whitespace-normal break-words font-medium">
            {displayClientName(grant)}
          </div>
        </td>

        <td className="px-3 py-3 text-content-dimmed whitespace-nowrap">{formatScopes(grant.scopes)}</td>

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
  const hasRead = scopes.includes("mcp:read") || scopes.length === 0;
  const hasWrite = scopes.includes("mcp:write");

  if (hasRead && hasWrite) return "View and edit";
  if (hasWrite) return "Edit only";
  if (hasRead) return "View only";

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
