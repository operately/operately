import React from "react";

import { DangerButton, PrimaryButton, SecondaryButton } from "../Button";
import { WarningCallout } from "../Callouts";
import { CopyToClipboard } from "../CopyToClipboard";
import { FormattedTime } from "../FormattedTime";
import { IconPencil, IconSwitch, IconTrash } from "../icons";
import { Link } from "../Link";
import { Menu, MenuActionItem } from "../Menu";
import { Modal } from "../Modal";
import { Page } from "../Page";
import { SwitchToggle } from "../SwitchToggle";
import { createTestId } from "../TestableElement";

export namespace AccountApiTokensPage {
  export interface Token {
    id: string;
    readOnly: boolean;
    name?: string | null;
    insertedAt?: string | null;
    lastUsedAt?: string | null;
  }

  export type PendingAction = "toggling" | "deleting" | "renaming";

  export interface Props {
    tokens: Token[];

    newTokenReadOnly: boolean;
    setNewTokenReadOnly: (value: boolean) => void;
    creatingToken: boolean;
    onCreateToken: () => void;
    onDismissNewlyCreatedToken: () => void;

    newlyCreatedToken: string | null;

    pendingTokenActions: Record<string, PendingAction | undefined>;
    onToggleReadOnly: (tokenId: string, readOnly: boolean) => void;
    onDeleteToken: (tokenId: string) => void;
    onUpdateName: (tokenId: string, name: string) => Promise<boolean>;

    homePath: string;
    securityPath: string;
    usagePath: string;
  }
}

export function AccountApiTokensPage(props: AccountApiTokensPage.Props) {
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);

  const navigation = React.useMemo(
    () => [
      { to: props.homePath, label: "Home" },
      { to: props.securityPath, label: "Password & Security" },
    ],
    [props.homePath, props.securityPath],
  );

  const openCreateModal = React.useCallback(() => {
    setIsCreateModalOpen(true);
  }, []);

  const closeCreateModal = React.useCallback(() => {
    setIsCreateModalOpen(false);
    props.onDismissNewlyCreatedToken();
  }, [props.onDismissNewlyCreatedToken]);

  return (
    <Page title="API Tokens" size="small" testId="account-api-tokens-page" navigation={navigation}>
      <div className="px-4 sm:px-10 py-8">
        <header>
          <h1 className="text-2xl font-bold">API Tokens</h1>
          <p className="text-sm text-content-dimmed mt-2">
            Use API tokens to access Operately programmatically from scripts, integrations, and automation tools.
          </p>
        </header>

        <section className="mt-10" data-test-id="create-api-token-section">
          <h2 className="font-bold">Create A Token</h2>
          <p className="text-sm text-content-dimmed mt-1">
            Read-only tokens can call queries only. Full-access tokens can call both queries and mutations.
          </p>

          <div className="mt-3">
            <PrimaryButton onClick={openCreateModal} testId="open-create-api-token-modal" size="sm">
              Create API Token
            </PrimaryButton>
          </div>

          <div className="mt-4 text-xs">
            <Link to={props.usagePath} underline="hover" testId="view-api-token-usage">
              View API usage instructions
            </Link>
          </div>
        </section>

        <section className="mt-10" data-test-id="existing-api-tokens-section">
          <h2 className="font-bold">Existing Tokens</h2>
          <p className="text-sm text-content-dimmed mt-1">Manage and revoke your active API tokens.</p>

          {props.tokens.length === 0 ? (
            <div className="text-sm text-content-dimmed rounded-md border border-stroke-base p-4 mt-3">
              No API tokens created yet.
            </div>
          ) : (
            <TokenList
              tokens={props.tokens}
              pendingTokenActions={props.pendingTokenActions}
              onToggleReadOnly={props.onToggleReadOnly}
              onDeleteToken={props.onDeleteToken}
              onUpdateName={props.onUpdateName}
            />
          )}
        </section>
      </div>

      <CreateTokenModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        newTokenReadOnly={props.newTokenReadOnly}
        setNewTokenReadOnly={props.setNewTokenReadOnly}
        creatingToken={props.creatingToken}
        onCreateToken={props.onCreateToken}
        newlyCreatedToken={props.newlyCreatedToken}
      />
    </Page>
  );
}

function CreateTokenModal({
  isOpen,
  onClose,
  newTokenReadOnly,
  setNewTokenReadOnly,
  creatingToken,
  onCreateToken,
  newlyCreatedToken,
}: {
  isOpen: boolean;
  onClose: () => void;
  newTokenReadOnly: boolean;
  setNewTokenReadOnly: (value: boolean) => void;
  creatingToken: boolean;
  onCreateToken: () => void;
  newlyCreatedToken: string | null;
}) {
  const hasCreatedToken = Boolean(newlyCreatedToken);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="small" title="Create API token" testId="create-api-token-modal">
      <div className="space-y-6">
        {!hasCreatedToken && (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-medium">Access mode for new token</div>
              <div className="text-sm text-content-dimmed mt-1">
                {newTokenReadOnly ? "Read-only (queries only)" : "Full access (queries + mutations)"}
              </div>
            </div>

            <SwitchToggle
              label={newTokenReadOnly ? "Read-only" : "Full access"}
              value={newTokenReadOnly}
              setValue={setNewTokenReadOnly}
              testId="new-api-token-read-only-toggle"
            />
          </div>
        )}

        {newlyCreatedToken && <NewlyCreatedTokenCard token={newlyCreatedToken} />}

        <div className="flex justify-end gap-4">
          {!hasCreatedToken && (
            <PrimaryButton size="sm" onClick={onCreateToken} loading={creatingToken} testId="create-api-token-button">
              Create API Token
            </PrimaryButton>
          )}
          <SecondaryButton size="sm" onClick={onClose} testId="close-create-api-token-modal">
            Close
          </SecondaryButton>
        </div>
      </div>
    </Modal>
  );
}

function NewlyCreatedTokenCard({ token }: { token: string }) {
  return (
    <div data-test-id="new-api-token-card">
      <WarningCallout
        message="Copy the token"
        description="This is the only time this value will be shown. Copy and store it securely."
      />

      <div className="mt-3 rounded-md border border-stroke-base bg-surface-dimmed p-3 flex items-start gap-3">
        <code className="text-xs sm:text-sm font-mono break-all flex-1" data-test-id="new-api-token-value">
          {token}
        </code>

        <CopyToClipboard text={token} size={18} className="shrink-0" testId="copy-new-api-token" />
      </div>
    </div>
  );
}

function TokenList({
  tokens,
  pendingTokenActions,
  onToggleReadOnly,
  onDeleteToken,
  onUpdateName,
}: {
  tokens: AccountApiTokensPage.Token[];
  pendingTokenActions: Record<string, AccountApiTokensPage.PendingAction | undefined>;
  onToggleReadOnly: (tokenId: string, readOnly: boolean) => void;
  onDeleteToken: (tokenId: string) => void;
  onUpdateName: (tokenId: string, name: string) => Promise<boolean>;
}) {
  const hasUsageMetadata = tokens.some((token) => token.insertedAt !== undefined || token.lastUsedAt !== undefined);

  return (
    <div className="mt-3">
      <div className="rounded-md border border-stroke-base overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-surface-dimmed text-left">
              <th className="px-3 py-2 font-semibold">Token</th>
              <th className="px-3 py-2 font-semibold">Access</th>
              <th className="px-3 py-2 font-semibold">Created</th>
              <th className="px-3 py-2 font-semibold whitespace-nowrap">Last Used</th>
              <th className="px-3 py-2 text-right">
                <span className="sr-only">Options</span>
              </th>
            </tr>
          </thead>

          <tbody>
            {tokens.map((token, index) => {
              const pendingAction = pendingTokenActions[token.id];

              return (
                <TokenRow
                  key={token.id}
                  token={token}
                  index={index}
                  pendingAction={pendingAction}
                  onToggleReadOnly={onToggleReadOnly}
                  onDeleteToken={onDeleteToken}
                  onUpdateName={onUpdateName}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      {!hasUsageMetadata && (
        <div className="text-xs text-content-dimmed mt-2">
          Created and last-used timestamps will appear here once available.
        </div>
      )}
    </div>
  );
}

function TokenRow({
  token,
  index,
  pendingAction,
  onToggleReadOnly,
  onDeleteToken,
  onUpdateName,
}: {
  token: AccountApiTokensPage.Token;
  index: number;
  pendingAction: AccountApiTokensPage.PendingAction | undefined;
  onToggleReadOnly: (tokenId: string, readOnly: boolean) => void;
  onDeleteToken: (tokenId: string) => void;
  onUpdateName: (tokenId: string, name: string) => Promise<boolean>;
}) {
  const [isRenameModalOpen, setIsRenameModalOpen] = React.useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [nameInput, setNameInput] = React.useState(token.name || "");
  const isPending = Boolean(pendingAction);

  const openRenameModal = React.useCallback(() => {
    if (isPending) return;

    setNameInput(token.name || "");
    setIsRenameModalOpen(true);
  }, [isPending, token.name]);

  const saveName = React.useCallback(async () => {
    if (isPending) return;

    const success = await onUpdateName(token.id, nameInput);

    if (success) {
      setIsRenameModalOpen(false);
    }
  }, [isPending, nameInput, onUpdateName, token.id]);

  const openDeleteModal = React.useCallback(() => {
    if (isPending) return;
    setIsDeleteModalOpen(true);
  }, [isPending]);

  const confirmDelete = React.useCallback(() => {
    if (isPending) return;
    setIsDeleteModalOpen(false);
    onDeleteToken(token.id);
  }, [isPending, onDeleteToken, token.id]);

  return (
    <>
      <tr className="border-t border-stroke-base">
        <td className="px-3 py-3 text-sm">
          <div className="max-w-[220px] sm:max-w-[320px] whitespace-normal break-words">
            {displayTokenName(token, index)}
          </div>
        </td>

        <td className="px-3 py-3 whitespace-nowrap">
          <span className="text-sm">{token.readOnly ? "Read-only" : "Full access"}</span>
        </td>

        <td className="px-3 py-3 text-content-dimmed whitespace-nowrap">
          <Timestamp value={token.insertedAt} emptyLabel="Not available" />
        </td>

        <td className="px-3 py-3 text-content-dimmed">
          <Timestamp value={token.lastUsedAt} emptyLabel="Never" />
        </td>

        <td className="px-3 py-3 text-right">
          <div className="inline-flex">
            <Menu align="end" testId={createTestId("api-token-actions-menu", token.id)}>
              <MenuActionItem icon={IconPencil} onClick={openRenameModal} testId={createTestId("update-api-token-name", token.id)}>
                Update name
              </MenuActionItem>

              <MenuActionItem
                icon={IconSwitch}
                onClick={() => {
                  if (!isPending) onToggleReadOnly(token.id, !token.readOnly);
                }}
                testId={createTestId("api-token-mode-toggle", token.id)}
              >
                {token.readOnly ? "Change to full access" : "Change to read-only"}
              </MenuActionItem>

              <MenuActionItem
                icon={IconTrash}
                onClick={() => {
                  openDeleteModal();
                }}
                danger
                testId={createTestId("delete-api-token", token.id)}
              >
                Delete
              </MenuActionItem>
            </Menu>
          </div>
        </td>
      </tr>

      <RenameTokenModal
        isOpen={isRenameModalOpen}
        name={nameInput}
        onChangeName={setNameInput}
        onClose={() => setIsRenameModalOpen(false)}
        onSave={saveName}
        isSaving={pendingAction === "renaming"}
      />

      <DeleteTokenModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        isDeleting={pendingAction === "deleting"}
        tokenName={displayTokenName(token, index)}
      />
    </>
  );
}

function RenameTokenModal({
  isOpen,
  name,
  onChangeName,
  onClose,
  onSave,
  isSaving,
}: {
  isOpen: boolean;
  name: string;
  onChangeName: (name: string) => void;
  onClose: () => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
}) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="small"
      title="Update token name"
      testId="update-api-token-name-modal"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <div className="font-bold text-sm mb-1 text-left">Token name</div>
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm bg-surface-base border-surface-outline"
            value={name}
            onChange={(e) => onChangeName(e.target.value)}
            placeholder="Enter token name"
            data-test-id="update-api-token-name-input"
            autoFocus
          />
        </label>

        <p className="text-xs text-content-dimmed">Leave empty to clear the name and use the default token label.</p>

        <div className="flex justify-end gap-3">
          <SecondaryButton type="button" onClick={onClose} disabled={isSaving} testId="update-api-token-name-cancel">
            Cancel
          </SecondaryButton>

          <PrimaryButton type="submit" loading={isSaving} testId="update-api-token-name-save">
            Save
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}

function DeleteTokenModal({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
  tokenName,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
  tokenName: string;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="small" title="Delete token" testId="delete-api-token-modal">
      <div className="space-y-4">
        <p className="text-sm text-content-dimmed">
          Delete <span className="font-medium text-content-base">{tokenName}</span>? This cannot be undone.
        </p>

        <div className="flex justify-end gap-3">
          <SecondaryButton type="button" onClick={onClose} disabled={isDeleting} testId="delete-api-token-cancel">
            Cancel
          </SecondaryButton>

          <DangerButton type="button" onClick={onConfirm} loading={isDeleting} testId="delete-api-token-confirm">
            Delete
          </DangerButton>
        </div>
      </div>
    </Modal>
  );
}

function displayTokenName(token: AccountApiTokensPage.Token, index: number) {
  const name = token.name?.trim();
  if (name) return name;

  return `token ${index + 1}`;
}

function Timestamp({ value, emptyLabel }: { value?: string | null; emptyLabel: string }) {
  if (value === null) return <span>{emptyLabel}</span>;
  if (value === undefined) return <span>-</span>;

  return <FormattedTime time={value} format="relative-time-or-date" />;
}

export default AccountApiTokensPage;
