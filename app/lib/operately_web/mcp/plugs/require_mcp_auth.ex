defmodule OperatelyWeb.Mcp.Plugs.RequireMcpAuth do
  import Plug.Conn

  alias Operately.Mcp
  alias OperatelyWeb.Mcp.Auth

  def init(opts), do: opts

  def call(conn, _opts) do
    with {:ok, raw_token} <- Auth.extract_bearer_token(conn),
         {:ok, %{access_token: access_token, grant: grant, account: account}} <- Mcp.authenticate_access_token(raw_token, Mcp.canonical_resource_uri()) do
      conn
      |> assign(:current_account, account)
      |> assign(:current_mcp_access_token, access_token)
      |> assign(:current_mcp_grant, grant)
      |> assign(:mcp_scopes, access_token.scopes)
      |> assign(:api_auth_mode, :mcp_oauth)
    else
      _ -> Auth.unauthorized(conn)
    end
  end
end
