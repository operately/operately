import Api from "@/api";

export type {
  ApiToken,
  ApiTokensCreateResult,
  ApiTokensDeleteResult,
  ApiTokensListResult,
  ApiTokensSetReadOnlyResult,
  ApiTokensUpdateNameResult,
  McpGrant,
  McpGrantsListResult,
  McpGrantsRevokeResult,
  Account,
} from "@/api";

export { changePassword, useJoinCompany } from "@/api";

export function listApiTokens() {
  return Api.api_tokens.list({});
}

export function createApiToken(attrs: { readOnly?: boolean }) {
  return Api.api_tokens.create(attrs);
}

export function deleteApiToken(id: string) {
  return Api.api_tokens.delete({ id });
}

export function setApiTokenReadOnly(id: string, readOnly: boolean) {
  return Api.api_tokens.setReadOnly({ id, readOnly });
}

export function updateApiTokenName(id: string, name?: string | null) {
  return Api.api_tokens.updateName({ id, name });
}

export function listMcpGrants() {
  return Api.mcp_grants.list({});
}

export function revokeMcpGrant(id: string) {
  return Api.mcp_grants.revoke({ id });
}
