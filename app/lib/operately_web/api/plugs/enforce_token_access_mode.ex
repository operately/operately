defmodule OperatelyWeb.Api.Plugs.EnforceTokenAccessMode do
  use Gettext, backend: OperatelyWeb.Gettext
  import Plug.Conn

  def init(opts), do: opts

  def call(conn, _opts) do
    if block_request?(conn) do
      conn
      |> send_resp(403, gettext("Read-only API tokens cannot execute mutations"))
      |> halt()
    else
      conn
    end
  end

  defp block_request?(conn) do
    conn.assigns[:api_auth_mode] == :api_token and mutation_request?(conn) and read_only_token?(conn)
  end

  defp mutation_request?(conn) do
    case conn.assigns[:turbo_req_type] do
      :mutation -> true
      "mutation" -> true
      _ -> false
    end
  end

  defp read_only_token?(conn) do
    case conn.assigns[:current_api_token] do
      %{read_only: true} -> true
      _ -> false
    end
  end
end
