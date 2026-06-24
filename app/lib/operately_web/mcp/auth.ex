defmodule OperatelyWeb.Mcp.Auth do
  import Plug.Conn

  alias Operately.Mcp

  def unauthorized(conn, opts \\ []) do
    conn
    |> put_resp_header("www-authenticate", bearer_challenge(opts))
    |> send_resp(401, "")
    |> halt()
  end

  def insufficient_scope(conn, scopes, opts \\ []) do
    conn
    |> put_resp_header("www-authenticate", insufficient_scope_challenge(scopes, opts))
    |> send_resp(403, "")
    |> halt()
  end

  def bearer_challenge(opts \\ []) do
    params =
      [
        {"resource_metadata", Mcp.protected_resource_metadata_url(:mcp)},
        {"scope", Keyword.get(opts, :scope, Mcp.scopes_to_string(Mcp.supported_scopes()))}
      ]
      |> Enum.reject(fn {_key, value} -> is_nil(value) or value == "" end)

    "Bearer " <>
      Enum.map_join(params, ", ", fn {key, value} -> ~s(#{key}="#{value}") end)
  end

  def insufficient_scope_challenge(scopes, opts \\ []) do
    params =
      [
        {"error", "insufficient_scope"},
        {"scope", Mcp.scopes_to_string(scopes)},
        {"resource_metadata", Mcp.protected_resource_metadata_url(:mcp)},
        {"error_description", Keyword.get(opts, :description)}
      ]
      |> Enum.reject(fn {_key, value} -> is_nil(value) or value == "" end)

    "Bearer " <>
      Enum.map_join(params, ", ", fn {key, value} -> ~s(#{key}="#{value}") end)
  end

  def extract_bearer_token(conn) do
    case get_req_header(conn, "authorization") do
      [auth_header | _rest] ->
        case String.split(String.trim(auth_header), " ", parts: 2) do
          ["Bearer", token] when token != "" -> {:ok, String.trim(token)}
          [token] when token != "" -> {:ok, String.trim(token)}
          _ -> :error
        end

      _ ->
        :error
    end
  end
end
