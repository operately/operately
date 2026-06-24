defmodule OperatelyWeb.Mcp.Plugs.ValidateOrigin do
  import Plug.Conn

  def init(opts), do: opts

  def call(conn, _opts) do
    case get_req_header(conn, "origin") do
      # Non-browser MCP clients (remote hosts, CLI, curl) usually omit Origin.
      # Only reject cross-origin browser requests that send a mismatched value.
      [] ->
        conn

      [origin | _rest] ->
        if valid_origin?(origin) do
          conn
        else
          conn
          |> send_resp(403, "")
          |> halt()
        end
    end
  end

  defp valid_origin?(origin) when is_binary(origin) do
    normalize_origin(origin) == normalize_origin(OperatelyWeb.Endpoint.url())
  end

  defp normalize_origin(value) do
    case URI.parse(value) do
      %URI{scheme: scheme, host: host, port: port} when is_binary(scheme) and is_binary(host) ->
        default_port =
          case scheme do
            "https" -> 443
            "http" -> 80
            _ -> port
          end

        "#{String.downcase(scheme)}://#{String.downcase(host)}:#{port || default_port}"

      _ ->
        :invalid
    end
  end
end
