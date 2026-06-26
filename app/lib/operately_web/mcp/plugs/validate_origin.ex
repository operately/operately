defmodule OperatelyWeb.Mcp.Plugs.ValidateOrigin do
  @moduledoc """
  Validates the `Origin` header for Streamable HTTP MCP requests.

  When Operately runs on localhost, only requests from the same machine are
  allowed through the browser `Origin` header. That blocks malicious websites
  from calling a local dev server on your machine.

  On a public host such as app.operately.com, any `Origin` is allowed because
  access is gated by OAuth bearer tokens, and remote MCP clients such as ChatGPT
  and Claude check connector URLs from their own sites during setup.
  """

  import Plug.Conn

  @localhost_hosts ~w(localhost 127.0.0.1 ::1)

  def init(opts), do: opts

  def call(conn, _opts) do
    case get_req_header(conn, "origin") do
      # Server-side clients (curl, ChatGPT backend) usually omit Origin.
      [] ->
        conn

      [origin | _rest] ->
        if allowed_origin?(origin) do
          conn
        else
          conn
          |> send_resp(403, "")
          |> halt()
        end
    end
  end

  defp allowed_origin?(origin) when is_binary(origin) do
    if strict_origin_validation?() do
      same_origin?(origin) or localhost_origin?(origin)
    else
      true
    end
  end

  defp strict_origin_validation? do
    Application.get_env(:operately, :mcp_strict_origin_validation, local_endpoint?())
  end

  defp local_endpoint? do
    OperatelyWeb.Endpoint.url()
    |> URI.parse()
    |> Map.get(:host)
    |> case do
      host when host in @localhost_hosts -> true
      _ -> false
    end
  end

  defp same_origin?(origin) do
    normalize_origin(origin) == normalize_origin(OperatelyWeb.Endpoint.url())
  end

  defp localhost_origin?(origin) do
    case URI.parse(origin) do
      %URI{host: host} when host in @localhost_hosts -> true
      _ -> false
    end
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
