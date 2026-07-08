defmodule Operately.Mcp do
  alias Operately.Billing
  alias Operately.Mcp.{ClientMetadata, Grant, Resources, Session}
  alias Operately.Mcp.Operations.Authorization
  alias Operately.Mcp.Operations.Grant, as: GrantOps
  alias Operately.Mcp.Operations.Session, as: SessionOps
  alias Operately.Mcp.Operations.TokenExchange
  alias Operately.People
  alias Operately.Repo

  @latest_protocol_version "2025-11-25"

  def latest_protocol_version, do: @latest_protocol_version

  defdelegate supported_scopes, to: Resources
  defdelegate default_scopes, to: Resources
  defdelegate scope_label(scope), to: Resources
  defdelegate scopes_to_string(scopes), to: Resources
  defdelegate canonical_resource_uri, to: Resources
  defdelegate localhost_redirect?(uri), to: ClientMetadata

  def protected_resource_metadata_url(:mcp), do: OperatelyWeb.Endpoint.url() <> "/.well-known/oauth-protected-resource/mcp"

  def eligible_companies(account), do: People.list_active_companies(account)

  def get_session(id), do: Repo.get(Session, id)

  defdelegate authorize_client_request(params), to: Authorization
  defdelegate exchange_authorization_code(attrs), to: TokenExchange
  defdelegate refresh_access_token(attrs), to: TokenExchange
  defdelegate authenticate_access_token(raw_token, resource), to: TokenExchange

  defdelegate upsert_grant(account, company, auth_request), to: GrantOps
  defdelegate issue_authorization_code(grant, auth_request), to: GrantOps
  defdelegate revoke_grant_for_reconnect(grant), to: GrantOps
  defdelegate list_grants_for_company(account, company), to: GrantOps
  defdelegate revoke_grant_for_company(account, company, grant_id), to: GrantOps
  defdelegate register_oauth_client(params), to: Operately.Mcp.Operations.ClientRegistration, as: :register

  defdelegate create_session(grant, access_token, params), to: SessionOps
  defdelegate close_session(session), to: SessionOps
  defdelegate mark_session_initialized(session), to: SessionOps
  defdelegate touch_session(session), to: SessionOps

  def load_company_and_person(%Grant{} = grant, account) do
    company =
      grant
      |> Repo.preload(:company)
      |> Map.fetch!(:company)
      |> Billing.attach_access_state()

    case People.get_person(account, company) do
      nil -> {:error, :membership_revoked}
      person when person.suspended -> {:error, :membership_revoked}
      person -> {:ok, {company, person}}
    end
  end
end
