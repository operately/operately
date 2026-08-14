defmodule OperatelyWeb.Mcp.Plugs.RequireMcpAuth do
  import Plug.Conn

  alias Operately.Mcp
  alias OperatelyWeb.Mcp.Auth

  def init(opts), do: opts

  def call(conn, _opts) do
    case Auth.extract_bearer_token(conn) do
      :error ->
        Auth.unauthorized(conn)

      {:ok, raw_token} ->
        case Mcp.authenticate_access_token(raw_token, Mcp.canonical_resource_uri()) do
          {:ok, %{access_token: access_token, grant: grant, account: account}} ->
            conn
            |> assign(:current_account, account)
            |> assign(:current_mcp_access_token, access_token)
            |> assign(:current_mcp_grant, grant)
            |> assign(:mcp_scopes, access_token.scopes)
            |> assign(:api_auth_mode, :mcp_oauth)

          _ ->
            Auth.unauthorized(conn, error: "invalid_token")
        end
    end
  end
end
