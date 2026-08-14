defmodule Operately.Mcp.Operations.TokenExchangeTest do
  use Operately.DataCase, async: true

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  alias Operately.Mcp
  alias Operately.Mcp.{Grant, RefreshToken, Token}
  alias Operately.Repo

  test "allows only one successor per refresh token" do
    account = account_fixture()
    company = company_fixture(%{company_name: "Unique Successor Co"}, account)
    grant = insert_grant!(account, company)
    previous = insert_refresh_token!(grant)

    insert_refresh_token!(grant, previous_token_id: previous.id)

    assert {:error, changeset} =
             %RefreshToken{}
             |> RefreshToken.changeset(%{
               grant_id: grant.id,
               token_hash: Token.hash("refresh-token-#{System.unique_integer()}"),
               resource: Mcp.canonical_resource_uri(),
               scopes: grant.scopes,
               expires_at: DateTime.add(Token.now(), 86_400, :second),
               previous_token_id: previous.id
             })
             |> Repo.insert()

    assert {"has already been taken", _} = changeset.errors[:previous_token_id]
  end

  defp insert_grant!(account, company) do
    %Grant{}
    |> Grant.changeset(%{
      account_id: account.id,
      company_id: company.id,
      client_id: "https://client.example.com/oauth/client.json",
      client_name: "Example MCP Client",
      redirect_uri: "https://client.example.com/callback",
      resource: Mcp.canonical_resource_uri(),
      scopes: ["mcp:read"]
    })
    |> Repo.insert!()
  end

  defp insert_refresh_token!(grant, attrs \\ []) do
    defaults = %{
      grant_id: grant.id,
      token_hash: Token.hash("refresh-token-#{System.unique_integer()}"),
      resource: Mcp.canonical_resource_uri(),
      scopes: grant.scopes,
      expires_at: DateTime.add(Token.now(), 86_400, :second)
    }

    %RefreshToken{}
    |> RefreshToken.changeset(Map.merge(defaults, Map.new(attrs)))
    |> Repo.insert!()
  end
end
