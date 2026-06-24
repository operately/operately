defmodule OperatelyWeb.McpControllerTest do
  use OperatelyWeb.ConnCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  alias Operately.Mcp

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
    company = company_fixture(%{company_name: "MCP Company"}, account)

    %{account: account, company: company, client: client}
  end

  test "returns a 401 challenge when authentication is missing" do
    conn =
      build_conn()
      |> put_req_header("accept", "application/json, text/event-stream")
      |> put_req_header("content-type", "application/json")
      |> post("/mcp", %{
        "jsonrpc" => "2.0",
        "id" => "1",
        "method" => "initialize",
        "params" => %{
          "protocolVersion" => Mcp.latest_protocol_version(),
          "capabilities" => %{},
          "clientInfo" => %{"name" => "Example Client", "version" => "1.0.0"}
        }
      })

    assert conn.status == 401
    assert get_resp_header(conn, "www-authenticate") |> List.first() =~ "resource_metadata="
  end

  test "rejects invalid origins", %{account: account, company: company, client: client} do
    %{access_token: access_token} = authorize_and_issue_tokens(account, company, client)

    conn =
      build_conn()
      |> put_req_header("accept", "application/json, text/event-stream")
      |> put_req_header("content-type", "application/json")
      |> put_req_header("authorization", "Bearer #{access_token}")
      |> put_req_header("origin", "https://evil.example.com")
      |> post("/mcp", initialize_request())

    assert conn.status == 403
  end

  test "initializes a session, accepts initialized notifications, and responds to ping", %{account: account, company: company, client: client} do
    %{access_token: access_token} = authorize_and_issue_tokens(account, company, client)

    initialize_conn =
      build_conn()
      |> authenticated_mcp_headers(access_token)
      |> post("/mcp", initialize_request())

    initialize_body = Jason.decode!(initialize_conn.resp_body)
    session_id = initialize_conn |> get_resp_header("mcp-session-id") |> List.first()

    assert initialize_conn.status == 200
    assert initialize_body["result"]["protocolVersion"] == Mcp.latest_protocol_version()
    assert initialize_body["result"]["capabilities"] == %{"tools" => %{"listChanged" => false}}
    assert is_binary(session_id)

    initialized_conn =
      build_conn()
      |> authenticated_mcp_headers(access_token)
      |> put_req_header("mcp-session-id", session_id)
      |> put_req_header("mcp-protocol-version", Mcp.latest_protocol_version())
      |> post("/mcp", %{
        "jsonrpc" => "2.0",
        "method" => "notifications/initialized"
      })

    assert initialized_conn.status == 202

    ping_conn =
      build_conn()
      |> authenticated_mcp_headers(access_token)
      |> put_req_header("mcp-session-id", session_id)
      |> put_req_header("mcp-protocol-version", Mcp.latest_protocol_version())
      |> post("/mcp", %{
        "jsonrpc" => "2.0",
        "id" => "2",
        "method" => "ping"
      })

    assert ping_conn.status == 200
    assert Jason.decode!(ping_conn.resp_body)["result"] == %{}

    tools_list_conn =
      build_conn()
      |> authenticated_mcp_headers(access_token)
      |> put_req_header("mcp-session-id", session_id)
      |> put_req_header("mcp-protocol-version", Mcp.latest_protocol_version())
      |> post("/mcp", %{
        "jsonrpc" => "2.0",
        "id" => "3",
        "method" => "tools/list"
      })

    tools_list_body = Jason.decode!(tools_list_conn.resp_body)
    tool_names = tools_list_body["result"]["tools"] |> Enum.map(& &1["name"])
    search_tool = Enum.find(tools_list_body["result"]["tools"], &(&1["name"] == "search"))

    assert tools_list_conn.status == 200

    assert tool_names == [
             "get_current_company",
             "get_me",
             "list_projects",
             "get_project",
             "list_goals",
             "get_goal",
             "list_tasks",
             "get_task",
             "search",
             "fetch"
           ]

    assert search_tool["outputSchema"]["type"] == "object"

    tools_call_conn =
      build_conn()
      |> authenticated_mcp_headers(access_token)
      |> put_req_header("mcp-session-id", session_id)
      |> put_req_header("mcp-protocol-version", Mcp.latest_protocol_version())
      |> post("/mcp", %{
        "jsonrpc" => "2.0",
        "id" => "4",
        "method" => "tools/call",
        "params" => %{
          "name" => "get_current_company",
          "arguments" => %{}
        }
      })

    assert tools_call_conn.status == 200
    assert Jason.decode!(tools_call_conn.resp_body)["error"]["code"] == -32601

    get_conn =
      build_conn()
      |> put_req_header("authorization", "Bearer #{access_token}")
      |> put_req_header("mcp-session-id", session_id)
      |> put_req_header("mcp-protocol-version", Mcp.latest_protocol_version())
      |> get("/mcp")

    assert get_conn.status == 405

    delete_conn =
      build_conn()
      |> put_req_header("authorization", "Bearer #{access_token}")
      |> put_req_header("mcp-session-id", session_id)
      |> put_req_header("mcp-protocol-version", Mcp.latest_protocol_version())
      |> delete("/mcp")

    assert delete_conn.status == 204

    closed_ping_conn =
      build_conn()
      |> authenticated_mcp_headers(access_token)
      |> put_req_header("mcp-session-id", session_id)
      |> put_req_header("mcp-protocol-version", Mcp.latest_protocol_version())
      |> post("/mcp", %{
        "jsonrpc" => "2.0",
        "id" => "5",
        "method" => "ping"
      })

    assert closed_ping_conn.status == 404
  end

  defp initialize_request do
    %{
      "jsonrpc" => "2.0",
      "id" => "1",
      "method" => "initialize",
      "params" => %{
        "protocolVersion" => Mcp.latest_protocol_version(),
        "capabilities" => %{},
        "clientInfo" => %{
          "name" => "Example Client",
          "version" => "1.0.0"
        }
      }
    }
  end

  defp authenticated_mcp_headers(conn, access_token) do
    conn
    |> put_req_header("accept", "application/json, text/event-stream")
    |> put_req_header("content-type", "application/json")
    |> put_req_header("authorization", "Bearer #{access_token}")
  end

  defp authorize_and_issue_tokens(account, company, client) do
    conn = build_conn() |> log_in_account(account, company)

    params = %{
      "client_id" => client.client_id,
      "redirect_uri" => hd(client.redirect_uris),
      "resource" => Mcp.canonical_resource_uri(),
      "scope" => "mcp:read",
      "state" => "mcp-state",
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
