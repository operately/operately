defmodule Operately.Mcp.Operations.GrantTest do
  use Operately.DataCase, async: true

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  alias Operately.Mcp
  alias Operately.Mcp.{AccessToken, Grant, RefreshToken, Session, Token}
  alias Operately.Mcp.Operations.Grant, as: GrantOps
  alias Operately.Repo

  setup do
    account = account_fixture()
    company = company_fixture(%{company_name: "Grant Co"}, account)
    other_company = company_fixture(%{company_name: "Second Co"}, account)
    other_account = account_fixture()
    other_company_for_other_account = company_fixture(%{company_name: "Other Co"}, other_account)

    %{
      account: account,
      company: company,
      other_company: other_company,
      other_account: other_account,
      other_company_for_other_account: other_company_for_other_account
    }
  end

  test "list_grants_for_company returns active grants with last_used_at", %{account: account, company: company} do
    grant = insert_grant!(account, company)
    now = Token.now()

    insert_access_token!(grant, last_used_at: now)

    [listed] = GrantOps.list_grants_for_company(account, company)

    assert listed.id == grant.id
    assert DateTime.compare(listed.last_used_at, now) == :eq
  end

  test "list_grants_for_company excludes revoked grants, other companies, and other accounts", %{
    account: account,
    company: company,
    other_company: other_company,
    other_account: other_account,
    other_company_for_other_account: other_company_for_other_account
  } do
    active = insert_grant!(account, company, client_id: "https://active.example.com/client.json")
    _revoked = insert_grant!(account, company, client_id: "https://revoked.example.com/client.json", revoked_at: Token.now())
    _other_company = insert_grant!(account, other_company, client_id: "https://other-company.example.com/client.json")
    _other_account = insert_grant!(other_account, other_company_for_other_account)

    grants = GrantOps.list_grants_for_company(account, company)

    assert Enum.map(grants, & &1.id) == [active.id]
  end

  test "revoke_grant_for_company revokes grant lineage", %{account: account, company: company} do
    grant = insert_grant!(account, company)
    access_token = insert_access_token!(grant)
    refresh_token = insert_refresh_token!(grant)
    session = insert_session!(grant, access_token)

    assert :ok = GrantOps.revoke_grant_for_company(account, company, grant.id)

    grant = Repo.get!(Grant, grant.id)
    access_token = Repo.get!(AccessToken, access_token.id)
    refresh_token = Repo.get!(RefreshToken, refresh_token.id)
    session = Repo.get!(Session, session.id)

    assert grant.revoked_at
    assert access_token.revoked_at
    assert refresh_token.revoked_at
    assert session.closed_at
  end

  test "revoke_grant_for_company returns not_found for another account", %{
    account: account,
    other_account: other_account,
    company: company
  } do
    grant = insert_grant!(account, company)

    assert {:error, :not_found} = GrantOps.revoke_grant_for_company(other_account, company, grant.id)
  end

  test "revoke_grant_for_company returns not_found for another company on the same account", %{
    account: account,
    company: company,
    other_company: other_company
  } do
    grant = insert_grant!(account, company)

    assert {:error, :not_found} = GrantOps.revoke_grant_for_company(account, other_company, grant.id)
  end

  test "revoke_grant_for_company returns not_found for unknown grant", %{account: account, company: company} do
    assert {:error, :not_found} = GrantOps.revoke_grant_for_company(account, company, Ecto.UUID.generate())
  end

  test "Mcp delegates list and revoke", %{account: account, company: company} do
    grant = insert_grant!(account, company)

    assert [%Grant{id: grant_id}] = Mcp.list_grants_for_company(account, company)
    assert grant_id == grant.id

    assert :ok = Mcp.revoke_grant_for_company(account, company, grant.id)
  end

  defp insert_grant!(account, company, attrs \\ []) do
    defaults = %{
      account_id: account.id,
      company_id: company.id,
      client_id: "https://client.example.com/oauth/client.json",
      client_name: "Example MCP Client",
      redirect_uri: "https://client.example.com/callback",
      resource: Mcp.canonical_resource_uri(),
      scopes: ["mcp:read"]
    }

    %Grant{}
    |> Grant.changeset(Map.merge(defaults, Map.new(attrs)))
    |> Repo.insert!()
  end

  defp insert_access_token!(grant, attrs \\ []) do
    now = Token.now()

    defaults = %{
      grant_id: grant.id,
      token_hash: Token.hash("access-token-#{System.unique_integer()}"),
      resource: Mcp.canonical_resource_uri(),
      scopes: grant.scopes,
      expires_at: DateTime.add(now, 3600, :second)
    }

    %AccessToken{}
    |> AccessToken.changeset(Map.merge(defaults, Map.new(attrs)))
    |> Repo.insert!()
  end

  defp insert_refresh_token!(grant) do
    now = Token.now()

    %RefreshToken{}
    |> RefreshToken.changeset(%{
      grant_id: grant.id,
      token_hash: Token.hash("refresh-token-#{System.unique_integer()}"),
      resource: Mcp.canonical_resource_uri(),
      scopes: grant.scopes,
      expires_at: DateTime.add(now, 86_400, :second)
    })
    |> Repo.insert!()
  end

  defp insert_session!(grant, access_token) do
    {:ok, session} =
      Mcp.create_session(grant, access_token, %{
        protocol_version: Mcp.latest_protocol_version(),
        client_info: %{"name" => "Example Client", "version" => "1.0.0"},
        client_capabilities: %{}
      })

    session
  end
end
