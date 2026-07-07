defmodule OperatelyWeb.Mcp.Plugs.RateLimitToolsCall do
  @moduledoc false

  import Plug.Conn
  import Phoenix.Controller, only: [json: 2]

  alias Operately.Mcp.{Observability, RateLimit}

  @jsonrpc_version "2.0"

  def init(opts), do: opts

  def call(%{body_params: %{"method" => "tools/call"}} = conn, _opts) do
    case RateLimit.check(:tools_call, grant_id: grant_id(conn)) do
      :ok ->
        conn

      {:error, retry_after} ->
        Observability.rate_limited(%{
          action: "tools_call",
          retry_after: retry_after,
          ip: RateLimit.format_ip(conn.remote_ip),
          grant_id: grant_id(conn)
        })

        Observability.tools_call(
          Map.merge(grant_context(conn), %{
            tool: tool_name(conn),
            outcome: "rate_limited",
            duration_ms: 0
          })
        )

        conn
        |> put_resp_header("retry-after", Integer.to_string(retry_after))
        |> put_status(429)
        |> json(%{
          jsonrpc: @jsonrpc_version,
          id: conn.body_params["id"],
          error: %{
            code: -32_000,
            message: "Rate limit exceeded"
          }
        })
        |> halt()
    end
  end

  def call(conn, _opts), do: conn

  defp grant_id(conn) do
    case conn.assigns[:current_mcp_grant] do
      %{id: id} -> id
      _ -> nil
    end
  end

  defp grant_context(conn) do
    case conn.assigns[:current_mcp_grant] do
      %{id: grant_id, client_id: client_id, company_id: company_id} ->
        %{grant_id: grant_id, client_id: client_id, company_id: company_id}

      _ ->
        %{}
    end
  end

  defp tool_name(conn) do
    case conn.body_params do
      %{"params" => %{"name" => name}} when is_binary(name) -> name
      _ -> "unknown"
    end
  end
end
