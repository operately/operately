defmodule OperatelyWeb.Analytics do
  @moduledoc "Browser metadata and authenticated request provenance for conversion analytics."
  import Plug.Conn
  alias Operately.Analytics.Context

  def context(conn) do
    if channel(conn) == "web", do: browser_context(conn), else: Map.put(Context.normalize(%{}), :channel, channel(conn))
  end

  defp browser_context(conn) do
    conn = fetch_cookies(conn)

    data =
      case conn.cookies["operately_analytics_v1"] do
        value when is_binary(value) and byte_size(value) <= 4096 ->
          decode_cookie(value)

        _ ->
          %{}
      end

    result = Context.normalize(data) |> Map.put(:channel, channel(conn))
    if get_req_header(conn, "dnt") == ["1"] or get_req_header(conn, "sec-gpc") == ["1"], do: Map.put(result, :preference, "denied"), else: result
  end

  defp decode_cookie(value) do
    case Jason.decode(URI.decode(value)) do
      {:ok, %{"version" => 1} = data} -> data
      _ -> %{}
    end
  rescue
    ArgumentError -> %{}
  end

  def channel(conn) do
    cond do
      conn.assigns[:api_auth_mode] == :mcp_oauth -> "mcp"
      conn.assigns[:current_cli_auth_session] != nil -> "cli"
      conn.assigns[:api_auth_mode] == :api_token -> "api"
      true -> "web"
    end
  end

  def bootstrap(conn) do
    config = Operately.Analytics.config()
    account_id = conn.assigns[:current_account] && conn.assigns.current_account.id

    %{
      enabled: Operately.Analytics.enabled?(),
      token: config[:token],
      host: config[:host],
      cookieDomain: config[:cookie_domain],
      optedOut: Operately.Analytics.enabled?() and Operately.Analytics.opted_out?(account_id)
    }
  end
end
