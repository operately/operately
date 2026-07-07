defmodule Operately.McpE2ECase do
  use ExUnit.CaseTemplate

  @endpoint OperatelyWeb.Endpoint

  import ExUnit.Assertions
  import ExUnit.Callbacks, only: [on_exit: 1]
  import Mock
  import Phoenix.ConnTest
  import Plug.Conn

  alias Operately.Mcp
  alias Operately.Mcp.ClientMetadata.Cache
  alias OperatelyWeb.Mcp.Tools, as: McpTools

  @cimd_client_id "https://cimd-integration.example.com/oauth/client.json"
  @cimd_redirect_uri "https://cimd-integration.example.com/callback"

  using do
    quote do
      use OperatelyWeb.ConnCase, async: false

      @endpoint OperatelyWeb.Endpoint

      import Ecto.Query
      import ExUnit.Assertions
      import Operately.McpE2ECase
      import Operately.FeatureSteps
      import Mock
      import Phoenix.ConnTest
      import Plug.Conn

      alias Operately.Mcp
      alias Operately.Repo
      alias Operately.Support.Factory
      alias OperatelyWeb.Paths
    end
  end

  def cimd_client_id, do: @cimd_client_id
  def cimd_redirect_uri, do: @cimd_redirect_uri

  def cimd_document(overrides \\ %{}) do
    Map.merge(
      %{
        "client_id" => @cimd_client_id,
        "client_name" => "CIMD Integration Client",
        "redirect_uris" => [@cimd_redirect_uri]
      },
      overrides
    )
  end

  def setup_cimd_env do
    previous_clients = Application.get_env(:operately, :mcp_oauth_clients)
    previous_lookup = Application.get_env(:operately, :mcp_cimd_dns_lookup)

    Application.put_env(:operately, :mcp_oauth_clients, [])

    Application.put_env(:operately, :mcp_cimd_dns_lookup, fn _host ->
      {:ok, {:hostent, ~c"cimd-integration.example.com", [], :inet, 4, [{93, 184, 216, 34}]}}
    end)

    Cache.clear()

    on_exit(fn ->
      Application.put_env(:operately, :mcp_oauth_clients, previous_clients)
      Application.put_env(:operately, :mcp_cimd_dns_lookup, previous_lookup)
      Cache.clear()
    end)

    :ok
  end

  # Stub Req.get for the CIMD client URL so Fetcher runs without a real HTTPS metadata server
  # (SafeUrl blocks localhost/non-443 endpoints in tests).
  def with_cimd_fetch(document, fun) when is_map(document) and is_function(fun, 0) do
    client_id = @cimd_client_id

    with_mock Req, [],
      get: fn ^client_id, _opts ->
        {:ok,
         %{
           status: 200,
           body: Jason.encode!(document),
           headers: %{"cache-control" => "max-age=60"}
         }}
      end do
      fun.()
    end
  end

  def authorize_params(scope \\ "mcp:read") do
    %{
      "client_id" => @cimd_client_id,
      "redirect_uri" => @cimd_redirect_uri,
      "resource" => Mcp.canonical_resource_uri(),
      "scope" => scope,
      "state" => "cimd-integration-state",
      "code_challenge" => pkce_challenge(),
      "code_challenge_method" => "S256"
    }
  end

  def exchange_authorization_code(conn, _params, code) do
    conn
    |> recycle()
    |> post("/oauth/token", %{
      "grant_type" => "authorization_code",
      "client_id" => @cimd_client_id,
      "redirect_uri" => @cimd_redirect_uri,
      "resource" => Mcp.canonical_resource_uri(),
      "code" => code,
      "code_verifier" => "test-verifier"
    })
  end

  def approve_authorization(conn, params) do
    consent_conn = get(conn, "/oauth/authorize", params)
    token = csrf_token(consent_conn)

    consent_conn
    |> recycle()
    |> post("/oauth/authorize", Map.merge(params, %{"decision" => "approve", "_csrf_token" => token}))
  end

  def authorization_code(redirect_conn) do
    redirect_conn
    |> redirected_to()
    |> URI.parse()
    |> Map.fetch!(:query)
    |> URI.decode_query()
    |> Map.fetch!("code")
  end

  def initialize_mcp_session(access_token) do
    initialize_conn =
      build_conn()
      |> authenticated_mcp_headers(access_token)
      |> post("/mcp", initialize_request())

    session_id = initialize_conn |> get_resp_header("mcp-session-id") |> List.first()

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

    {initialize_conn, session_id}
  end

  def post_mcp(access_token, session_id, payload) do
    build_conn()
    |> authenticated_mcp_headers(access_token)
    |> put_req_header("mcp-session-id", session_id)
    |> put_req_header("mcp-protocol-version", Mcp.latest_protocol_version())
    |> post("/mcp", payload)
  end

  def call_tool(access_token, session_id, name, arguments \\ %{}) do
    post_mcp(access_token, session_id, %{
      "jsonrpc" => "2.0",
      "id" => "tool-call",
      "method" => "tools/call",
      "params" => %{
        "name" => name,
        "arguments" => arguments
      }
    })
  end

  def json_body(conn), do: Jason.decode!(conn.resp_body)

  def expected_tool_names do
    McpTools.list_definitions()
    |> Enum.map(& &1.name)
  end

  def csrf_token(conn) do
    {:ok, document} = Floki.parse_document(conn.resp_body)

    document
    |> Floki.find("input[name=\"_csrf_token\"]")
    |> Floki.attribute("value")
    |> List.first()
  end

  def pkce_challenge do
    :crypto.hash(:sha256, "test-verifier")
    |> Base.url_encode64(padding: false)
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
          "name" => "CIMD Integration Client",
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
end
