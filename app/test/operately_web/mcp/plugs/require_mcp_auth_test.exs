defmodule OperatelyWeb.Mcp.Plugs.RequireMcpAuthTest do
  use OperatelyWeb.ConnCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  alias Operately.Mcp
  alias OperatelyWeb.Mcp.Plugs.{RequireMcpAuth, ResolveCompany}

  setup do
    client = %{
      client_id: "https://client.example.com/oauth/client.json",
      client_name: "Example MCP Client",
      redirect_uris: ["https://client.example.com/callback"],
      token_endpoint_auth_method: "none"
    }

    previous_clients = Application.get_env(:operately, :mcp_oauth_clients)
    Application.put_env(:operately, :mcp_oauth_clients, [client])

    on_exit(fn ->
      Application.put_env(:operately, :mcp_oauth_clients, previous_clients)
    end)

    account = account_fixture()
    company = company_fixture(%{company_name: "Plug Company"}, account)

    %{account: account, company: company, client: client}
  end

  test "assigns account, company, person, scopes, and auth mode", %{account: account, company: company, client: client} do
    %{access_token: access_token} = authorize_and_issue_tokens(account, company, client)

    conn =
      build_conn()
      |> put_req_header("authorization", "Bearer #{access_token}")
      |> RequireMcpAuth.call([])
      |> ResolveCompany.call([])

    assert conn.assigns.api_auth_mode == :mcp_oauth
    assert conn.assigns.current_account.id == account.id
    assert conn.assigns.current_company.id == company.id
    assert conn.assigns.current_person.account_id == account.id
    assert conn.assigns.mcp_scopes == ["mcp:read"]
    assert conn.assigns.current_mcp_grant.company_id == company.id
  end

  defp authorize_and_issue_tokens(account, company, client) do
    conn = build_conn() |> log_in_account(account, company)

    params = %{
      "client_id" => client.client_id,
      "redirect_uri" => hd(client.redirect_uris),
      "resource" => Mcp.canonical_resource_uri(),
      "scope" => "mcp:read",
      "state" => "plug-state",
      "code_challenge" => pkce_challenge(),
      "code_challenge_method" => "S256"
    }

    consent_conn = get(conn, "/oauth/authorize", params)
    csrf_token = csrf_token(consent_conn)

    redirect_conn =
      consent_conn
      |> recycle()
      |> post("/oauth/authorize", Map.merge(params, %{"decision" => "approve", "_csrf_token" => csrf_token}))

    code =
      redirect_conn
      |> redirected_to()
      |> URI.parse()
      |> Map.fetch!(:query)
      |> URI.decode_query()
      |> Map.fetch!("code")

    token_conn =
      post(build_conn(), "/oauth/token", %{
        "grant_type" => "authorization_code",
        "client_id" => client.client_id,
        "redirect_uri" => hd(client.redirect_uris),
        "resource" => Mcp.canonical_resource_uri(),
        "code" => code,
        "code_verifier" => "test-verifier"
      })

    Jason.decode!(token_conn.resp_body, keys: :atoms)
  end

  defp csrf_token(conn) do
    {:ok, document} = Floki.parse_document(conn.resp_body)

    document
    |> Floki.find("input[name=\"_csrf_token\"]")
    |> Floki.attribute("value")
    |> List.first()
  end

  defp pkce_challenge do
    :crypto.hash(:sha256, "test-verifier")
    |> Base.url_encode64(padding: false)
  end
end
