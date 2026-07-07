defmodule OperatelyWeb.Mcp.Plugs.Cors do
  @moduledoc """
  Handles CORS for MCP OAuth discovery and transport endpoints.

  Browser-based connector setup in ChatGPT and Claude may preflight these paths
  from their own origins before fetching metadata or calling `/mcp`.
  """

  import Plug.Conn

  @discovery_paths ~w(
    /.well-known/oauth-protected-resource
    /.well-known/oauth-protected-resource/mcp
    /.well-known/oauth-authorization-server
    /.well-known/oauth-authorization-server/mcp
    /.well-known/openid-configuration
    /.well-known/openid-configuration/mcp
  )

  @oauth_paths ~w(/oauth/register /oauth/token)

  @mcp_path "/mcp"
  @allow_headers "authorization, content-type, accept, mcp-session-id, mcp-protocol-version, origin"
  @max_age "86400"

  def init(opts), do: opts

  def call(conn, _opts) do
    if cors_path?(conn.request_path) do
      conn = register_before_send(conn, &put_cors_origin/1)

      if conn.method == "OPTIONS" do
        conn
        |> put_resp_header("access-control-allow-methods", allowed_methods(conn.request_path))
        |> put_resp_header("access-control-allow-headers", @allow_headers)
        |> put_resp_header("access-control-max-age", @max_age)
        |> put_cors_origin()
        |> send_resp(204, "")
        |> halt()
      else
        conn
      end
    else
      conn
    end
  end

  defp cors_path?(path) when path in @discovery_paths, do: true
  defp cors_path?(path) when path in @oauth_paths, do: true
  defp cors_path?(@mcp_path), do: true
  defp cors_path?(_), do: false

  defp allowed_methods(@mcp_path), do: "GET, POST, DELETE, OPTIONS"
  defp allowed_methods(path) when path in @oauth_paths, do: "POST, OPTIONS"
  defp allowed_methods(_discovery_path), do: "GET, OPTIONS"

  defp put_cors_origin(conn) do
    put_resp_header(conn, "access-control-allow-origin", allow_origin(conn))
  end

  defp allow_origin(conn) do
    case get_req_header(conn, "origin") do
      [origin | _] when is_binary(origin) and origin != "" -> origin
      _ -> "*"
    end
  end
end
