import { loader, useLoadedData } from "./loader";
import * as Accounts from "@/models/accounts";
import * as React from "react";

import { PageModule } from "@/routes/types";
import { usePaths } from "@/routes/paths";
import { AccountApiTokensPage, showErrorToast, showSuccessToast } from "turboui";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";

export default { name: "AccountApiTokensPage", loader, Page } as PageModule;

type PendingAction = "toggling" | "deleting" | "renaming";

function Page() {
  const paths = usePaths();
  const formattedTimePreferences = useFormattedTimePreferences();
  const { apiTokens } = useLoadedData();
  const { mutateAsync: createToken } = Accounts.useCreateApiToken();
  const { mutateAsync: deleteToken } = Accounts.useDeleteApiToken();
  const { mutateAsync: setReadOnly } = Accounts.useSetApiTokenReadOnly();
  const { mutateAsync: updateName } = Accounts.useUpdateApiTokenName();

  const [tokens, setTokens] = React.useState<Accounts.ApiToken[]>(apiTokens);

  const [creatingToken, setCreatingToken] = React.useState(false);
  const [newTokenReadOnly, setNewTokenReadOnly] = React.useState(true);
  const [newlyCreatedToken, setNewlyCreatedToken] = React.useState<string | null>(null);
  const [pendingTokenActions, setPendingTokenActions] = React.useState<Record<string, PendingAction | undefined>>({});

  React.useEffect(() => {
    setTokens(apiTokens);
  }, [apiTokens]);

  const setPendingTokenAction = React.useCallback((tokenId: string, action: PendingAction | null) => {
    setPendingTokenActions((prev) => {
      if (action) {
        return { ...prev, [tokenId]: action };
      }

      const next = { ...prev };
      delete next[tokenId];
      return next;
    });
  }, []);

  const handleCreateToken = React.useCallback(async () => {
    if (creatingToken) return;

    setCreatingToken(true);

    try {
      const result = await createToken({ readOnly: newTokenReadOnly });
      setNewlyCreatedToken(result.token);
      showSuccessToast("API Token Created", "Copy the token now. For security reasons, it will only be shown once.");
    } catch {
      showErrorToast("Failed To Create Token", "Please try again.");
    } finally {
      setCreatingToken(false);
    }
  }, [creatingToken, newTokenReadOnly, createToken]);

  const handleToggleReadOnly = React.useCallback(
    async (tokenId: string, readOnly: boolean) => {
      if (pendingTokenActions[tokenId]) return;

      const previousToken = tokens.find((token) => token.id === tokenId);
      if (!previousToken) return;

      setPendingTokenAction(tokenId, "toggling");
      setTokens((prev) => prev.map((token) => (token.id === tokenId ? { ...token, readOnly } : token)));

      try {
        await setReadOnly({ id: tokenId, readOnly });
        showSuccessToast("Token Updated", readOnly ? "Token is now read-only." : "Token now has full access.");
      } catch {
        setTokens((prev) =>
          prev.map((token) => (token.id === tokenId ? { ...token, readOnly: previousToken.readOnly } : token)),
        );
        showErrorToast("Failed To Update Token", "Please try again.");
      } finally {
        setPendingTokenAction(tokenId, null);
      }
    },
    [pendingTokenActions, setPendingTokenAction, tokens, setReadOnly],
  );

  const handleDeleteToken = React.useCallback(
    async (tokenId: string) => {
      if (pendingTokenActions[tokenId]) return;

      const previousIndex = tokens.findIndex((token) => token.id === tokenId);
      if (previousIndex === -1) return;
      const deletedToken = tokens[previousIndex];
      if (!deletedToken) return;

      setPendingTokenAction(tokenId, "deleting");
      setTokens((prev) => prev.filter((token) => token.id !== tokenId));

      try {
        await deleteToken({ id: tokenId });
        showSuccessToast("Token Deleted", "The API token was removed.");
      } catch {
        setTokens((prev) => {
          const next = [...prev];
          next.splice(previousIndex, 0, deletedToken);
          return next;
        });
        showErrorToast("Failed To Delete Token", "Please try again.");
      } finally {
        setPendingTokenAction(tokenId, null);
      }
    },
    [pendingTokenActions, setPendingTokenAction, tokens, deleteToken],
  );

  const handleUpdateName = React.useCallback(
    async (tokenId: string, name: string) => {
      if (pendingTokenActions[tokenId]) return false;

      const previousToken = tokens.find((token) => token.id === tokenId);
      if (!previousToken) return false;

      const normalizedName = name.trim();
      const nextName = normalizedName.length === 0 ? null : normalizedName;

      setPendingTokenAction(tokenId, "renaming");
      setTokens((prev) => prev.map((token) => (token.id === tokenId ? { ...token, name: nextName } : token)));

      try {
        await updateName({ id: tokenId, name });
        showSuccessToast("Token Updated", "Token name updated.");
        return true;
      } catch {
        setTokens((prev) =>
          prev.map((token) => (token.id === tokenId ? { ...token, name: previousToken.name } : token)),
        );
        showErrorToast("Failed To Update Token", "Please try again.");
        return false;
      } finally {
        setPendingTokenAction(tokenId, null);
      }
    },
    [pendingTokenActions, setPendingTokenAction, tokens, updateName],
  );

  return (
    <AccountApiTokensPage
      tokens={tokens}
      newTokenReadOnly={newTokenReadOnly}
      setNewTokenReadOnly={setNewTokenReadOnly}
      creatingToken={creatingToken}
      onCreateToken={handleCreateToken}
      onDismissNewlyCreatedToken={() => setNewlyCreatedToken(null)}
      newlyCreatedToken={newlyCreatedToken}
      pendingTokenActions={pendingTokenActions}
      onToggleReadOnly={handleToggleReadOnly}
      onDeleteToken={handleDeleteToken}
      onUpdateName={handleUpdateName}
      homePath={paths.homePath()}
      securityPath={paths.accountSecurityPath()}
      usagePath={paths.accountApiTokensUsagePath()}
      formattedTimePreferences={formattedTimePreferences}
    />
  );
}
