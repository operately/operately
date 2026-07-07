defmodule OperatelyWeb.Mcp.Plugs.RateLimitOAuth do
  @moduledoc false

  import Plug.Conn
  import Phoenix.Controller, only: [json: 2, put_view: 2, render: 3]

  alias Operately.Mcp.{Observability, RateLimit}

  def init(action) when action in [:oauth_authorize, :oauth_token], do: action

  def call(conn, action) do
    case RateLimit.check(action, rate_limit_keys(conn, action)) do
      :ok ->
        conn

      {:error, retry_after} ->
        Observability.rate_limited(%{
          action: Atom.to_string(action),
          retry_after: retry_after,
          ip: RateLimit.format_ip(conn.remote_ip),
          client_id: conn.params["client_id"]
        })

        conn
        |> put_resp_header("retry-after", Integer.to_string(retry_after))
        |> render_rate_limited(action, retry_after)
        |> halt()
    end
  end

  defp rate_limit_keys(conn, :oauth_authorize) do
    [ip: RateLimit.format_ip(conn.remote_ip)]
  end

  defp rate_limit_keys(conn, :oauth_token) do
    [
      ip: RateLimit.format_ip(conn.remote_ip),
      client_id: conn.params["client_id"]
    ]
  end

  defp render_rate_limited(conn, :oauth_authorize, retry_after) do
    conn
    |> put_status(429)
    |> put_view(OperatelyWeb.McpOAuthHTML)
    |> render(:error,
      title: "Too Many Requests",
      message: "Too many authorization requests. Try again in #{retry_after} seconds."
    )
  end

  defp render_rate_limited(conn, :oauth_token, _retry_after) do
    conn
    |> put_status(429)
    |> json(%{
      error: "temporarily_unavailable",
      error_description: "Rate limit exceeded."
    })
  end
end
