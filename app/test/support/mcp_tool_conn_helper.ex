defmodule OperatelyWeb.Mcp.ToolConnHelper do
  @moduledoc false

  @endpoint OperatelyWeb.Endpoint

  import Phoenix.ConnTest
  import OperatelyWeb.ConnCase
  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  alias Plug.Conn
  alias Operately.Mcp
  alias Operately.Mcp.RateLimit
  alias Operately.People
  alias Operately.Repo
  alias Operately.RichContent
  alias OperatelyWeb.Api.Helpers, as: ApiHelpers

  @default_rate_limits %{
    oauth_authorize: %{limit: 10_000, period_seconds: 60, keys: [:ip]},
    oauth_token: %{limit: 10_000, period_seconds: 60, keys: [:ip, :client_id]},
    cimd_fetch_url: %{limit: 10_000, period_seconds: 60, keys: [:client_id]},
    tools_call: %{limit: 10_000, period_seconds: 60, keys: [:grant_id]}
  }

  def authorize_and_issue_tokens(account, company, client, scope \\ "mcp:read", opts \\ []) do
    build_conn()
    |> log_in_account(account, company)
    |> authorize_and_issue_tokens_conn(client, scope, opts)
  end

  def authorize_params(client, redirect_uri, scope \\ "mcp:read") do
    %{
      "client_id" => client.client_id,
      "redirect_uri" => redirect_uri,
      "resource" => Mcp.canonical_resource_uri(),
      "scope" => scope,
      "state" => "mcp-state",
      "code_challenge" => pkce_challenge(),
      "code_challenge_method" => "S256"
    }
  end

  def initialize_session(access_token) do
    conn =
      build_conn()
      |> authenticated_mcp_headers(access_token)
      |> post("/mcp", initialize_request())

    {conn, conn |> Plug.Conn.get_resp_header("mcp-session-id") |> List.first()}
  end

  def call_tool(access_token, session_id, name, arguments \\ %{}) do
    build_conn()
    |> session_headers(access_token, session_id)
    |> post("/mcp", %{
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

  def authenticated_mcp_headers(conn, access_token) do
    conn
    |> Plug.Conn.put_req_header("accept", "application/json, text/event-stream")
    |> Plug.Conn.put_req_header("content-type", "application/json")
    |> Plug.Conn.put_req_header("authorization", "Bearer #{access_token}")
  end

  def initialize_request do
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

  def conn_with_assigns(account, company, person, scopes \\ ["mcp:read"]) do
    %Conn{}
    |> Map.put(:assigns, %{
      current_account: account,
      current_company: company,
      current_person: person,
      mcp_scopes: scopes,
      api_auth_mode: :mcp_oauth
    })
  end

  def fresh_context do
    account = account_fixture()
    company = company_fixture(%{company_name: "MCP Company"}, account)
    person = People.get_person(account, company)

    %{account: account, company: company, person: person}
  end

  def conn(ctx, scopes \\ ["mcp:read", "mcp:write"]) do
    conn_as(ctx, default_person(ctx), scopes)
  end

  def conn_as(ctx, person_or_key, scopes \\ ["mcp:read", "mcp:write"])

  def conn_as(ctx, person_key, scopes) when is_atom(person_key) do
    conn_as(ctx, Map.fetch!(ctx, person_key), scopes)
  end

  def conn_as(ctx, person, scopes) do
    conn_with_assigns(ctx.account, ctx.company, person, scopes)
  end

  def reload(resource), do: Repo.reload(resource)

  def reload(resource, preloads) do
    resource
    |> Repo.reload()
    |> Repo.preload(preloads)
  end

  def decode_id!(id) do
    {:ok, decoded_id} = ApiHelpers.decode_id(id)
    decoded_id
  end

  def rich_text_to_string(nil), do: nil

  def rich_text_to_string(content) when is_binary(content) do
    content
    |> Jason.decode!()
    |> rich_text_to_string()
  end

  def rich_text_to_string(content) when is_map(content) do
    content
    |> RichContent.rich_content_to_string()
    |> normalize_text()
  end

  def normalize_text(text) do
    text
    |> String.replace(~r/\s+/, " ")
    |> String.trim()
  end

  def with_rate_limits(overrides, fun) when is_map(overrides) and is_function(fun, 0) do
    previous_limits = Application.get_env(:operately, :mcp_rate_limits)
    limits = Map.merge(@default_rate_limits, previous_limits || %{}) |> Map.merge(overrides)

    Application.put_env(:operately, :mcp_rate_limits, limits)
    RateLimit.clear()

    try do
      fun.()
    after
      Application.put_env(:operately, :mcp_rate_limits, previous_limits)
      RateLimit.clear()
    end
  end

  defp authorize_and_issue_tokens_conn(conn, client, scope, opts) do
    params =
      authorize_params(client, hd(client.redirect_uris), scope)
      |> maybe_put_selected_company_id(opts)

    consent_conn = get(conn, "/oauth/authorize", params)
    token = csrf_token(consent_conn)

    redirect_conn =
      consent_conn
      |> recycle()
      |> post("/oauth/authorize", Map.merge(params, %{"decision" => "approve", "_csrf_token" => token}))

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

  def session_headers(conn, access_token, session_id) do
    conn
    |> authenticated_mcp_headers(access_token)
    |> Plug.Conn.put_req_header("mcp-session-id", session_id)
    |> Plug.Conn.put_req_header("mcp-protocol-version", Mcp.latest_protocol_version())
  end

  defp maybe_put_selected_company_id(params, opts) do
    case Keyword.get(opts, :selected_company_id) do
      nil ->
        params

      company_id when is_binary(company_id) ->
        Map.put(params, "selected_company_id", company_id)

      company ->
        Map.put(params, "selected_company_id", OperatelyWeb.Paths.company_id(company))
    end
  end

  defp default_person(ctx) do
    Map.get(ctx, :person) || Map.fetch!(ctx, :creator)
  end
end
